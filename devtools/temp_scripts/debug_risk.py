
import requests
import json

BASE_URL = "http://localhost:8000"

def debug_risk_mismatch():
    # 1. Find Offender "Goodwin, Anna"
    print("Searching for Goodwin, Anna...")
    resp = requests.get(f"{BASE_URL}/offenders?limit=100")
    if resp.status_code != 200:
        print("Failed to fetch offenders")
        return

    offenders = resp.json()["data"]
    target = next((o for o in offenders if "Goodwin" in o["name"]), None)
    
    if not target:
        print("Goodwin, Anna not found in the first 100 offenders.")
        return

    offender_id = target["id"]
    print(f"Found Offender: {target['name']} (ID: {offender_id})")
    print(f"Dashboard/API Risk Level: {target['risk']}")

    # 2. Check Risk Assessments
    print("\nFetching Risk Assessments...")
    resp = requests.get(f"{BASE_URL}/offenders/{offender_id}/risk")
    assessments = resp.json()
    
    if not assessments:
        print("No risk assessments found.")
    else:
        latest = assessments[0]
        print(f"Latest Assessment Date: {latest['date']}")
        print(f"Latest Assessment Risk: {latest['risk_level']}")
        print(f"Latest Assessment Final Risk (Override): {latest.get('final_risk_level')}")
        
        if target['risk'] != latest.get('final_risk_level', latest['risk_level']):
             print("MISMATCH DETECTED!")
        else:
             print("Risk levels match.")

if __name__ == "__main__":
    debug_risk_mismatch()
