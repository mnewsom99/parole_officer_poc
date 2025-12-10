import requests
from backend import auth, database, models
from backend.database import SessionLocal

# 1. Get Auth Token
def get_token():
    try:
        response = requests.post("http://localhost:8000/token", data={
            "username": "admin",
            "password": "admin123"
        })
        return response.json().get("access_token")
    except Exception as e:
        print(f"Auth failed: {e}")
        return None

# 2. Get Valid Officer ID
def get_officer_id():
    db = SessionLocal()
    officer = db.query(models.Officer).first()
    db.close()
    return str(officer.officer_id) if officer else None

# 3. Try Create Task
def run_debug():
    token = get_token()
    if not token:
        print("Could not get token. Is server running?")
        return

    officer_id = get_officer_id()
    if not officer_id:
        print("No officers in DB.")
        return

    print(f"Using officer ID: {officer_id}")

    payload = {
        "title": "Debug Task",
        "description": "Testing from script",
        "due_date": None, # Simulating empty date logic
        "priority": "Normal",
        "assigned_officer_id": officer_id,
        "category": "Home Visit",
        "sub_category": "Routine"
    }

    headers = {"Authorization": f"Bearer {token}"}
    
    print("Sending payload:", payload)
    
    resp = requests.post("http://localhost:8000/tasks", json=payload, headers=headers)
    
    print(f"Status Code: {resp.status_code}")
    print("Response Body:", resp.text)

if __name__ == "__main__":
    run_debug()
