import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_update():
    # 1. Create Instrument
    print("Creating instrument...")
    create_payload = {
        "name": f"Test Inst {uuid.uuid4()}",
        "version": "v1.0",
        "target_populations": ["Male"],
        "scoring_method": "Additive",
        "domains": [],
        "scoring_tables": []
    }
    res = requests.post(f"{BASE_URL}/assessments/instruments", json=create_payload)
    if res.status_code != 200:
        print(f"Failed to create: {res.text}")
        return
    
    inst = res.json()
    inst_id = inst["instrument_id"]
    print(f"Created ID: {inst_id}")

    # 2. Update Instrument (PUT)
    # Mimic frontend payload: includes extra fields like 'instrument_id' which should be ignored?
    # And domains with 'id' field.
    
    update_payload = {
        "name": f"Updated Name {uuid.uuid4()}",
        "version": "v1.1",
        "target_populations": ["Male", "Female"],
        "scoring_method": "Additive",
        "is_active": True,
        # Frontend sends 'instrument_id' probably, let's include it to test robustness
        "instrument_id": inst_id, 
        "domains": [
            {
                "id": str(uuid.uuid4()), # Temp ID from frontend
                "name": "New Domain A",
                "order_index": 0,
                "items": [
                    {
                        "text": "Question 1",
                        "control_type": "Radio",
                        "options": [
                            {"label": "Yes", "value": "1", "points": 1},
                            {"label": "No", "value": "0", "points": 0}
                        ]
                    }
                ]
            }
        ],
        "scoring_tables": []
    }
    
    print("\nSending PUT...")
    res = requests.put(f"{BASE_URL}/assessments/instruments/{inst_id}", json=update_payload)
    
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == "__main__":
    test_update()
