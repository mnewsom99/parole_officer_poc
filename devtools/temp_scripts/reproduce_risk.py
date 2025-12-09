
import requests
import json
import datetime

BASE_URL = "http://localhost:8000"

def reproduce_risk_bug():
    # 1. Get an offender
    print("Fetching offenders...")
    resp = requests.get(f"{BASE_URL}/offenders")
    data = resp.json()["data"]
    if not data:
        print("No offenders found")
        return
        
    offender = data[0]
    oid = offender["id"]
    initial_risk = offender["risk"]
    print(f"Test Offender: {offender['name']} (ID: {oid})")
    print(f"Initial Risk: {initial_risk}")
    
    # 2. Create Assessment Session
    print("\nCreating Assessment Session...")
    today = datetime.date.today().isoformat()
    resp = requests.post(f"{BASE_URL}/assessments/", params={
        "offender_id": oid,
        "assessment_type": "ORAS-CST",
        "date": today
    })
    if resp.status_code != 200:
        print(f"Failed to create session: {resp.text}")
        return
    assessment = resp.json()
    aid = assessment["assessment_id"]
    print(f"Assessment Created: {aid}")
    
    # 3. Submit with Override (Force LOW -> HIGH or HIGH -> LOW)
    # If currently High, override to Low, else High.
    new_risk = "Low" if initial_risk == "High" else "High"
    print(f"Attempting to override risk to: {new_risk}")
    
    submit_body = {
        "final_risk_level": new_risk,
        "override_reason": "Automated Test Override"
    }
    
    resp = requests.post(f"{BASE_URL}/assessments/{aid}/submit", json=submit_body)
    if resp.status_code != 200:
        print(f"Failed to submit: {resp.text}")
        return
    
    result = resp.json()
    print(f"Submission Result: {result}")
    
    # 4. Verify Offender Record Updated
    print("\nVerifying Offender Record...")
    resp = requests.get(f"{BASE_URL}/offenders/{oid}")
    updated_offender = resp.json()
    updated_risk = updated_offender["risk"]
    
    print(f"Updated Offender Risk: {updated_risk}")
    
    if updated_risk == new_risk:
        print("SUCCESS: Risk level updated correctly.")
    else:
        print(f"FAILURE: Risk level did NOT update. Expected {new_risk}, got {updated_risk}")

if __name__ == "__main__":
    reproduce_risk_bug()
