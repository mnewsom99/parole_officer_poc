import requests
import json

try:
    print("Fetching single offender from list...")
    response = requests.get("http://localhost:8000/offenders?limit=1")
    response.raise_for_status()
    
    data = response.json().get("data", [])
    if not data:
        print("No offenders found to verify.")
    else:
        offender = data[0]
        print(f"Checking Offender: {offender.get('name')}")
        print(f" - employment_status: {offender.get('employment_status')}")
        print(f" - csed_date: {offender.get('csed_date')}")
        
        if 'employment_status' in offender and 'csed_date' in offender:
            print("SUCCESS: Fields present.")
        else:
            print("FAILURE: Fields missing.")

except Exception as e:
    print(f"Error: {e}")
