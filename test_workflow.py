import requests
import json

BASE_URL = "http://127.0.0.1:8000"

# 1. Setup - We need credentials/token to act as different users
# For simplicity in this local dev env, I might assume the "admin" user exists from seeding.
# But for the workflow I need specific roles: Officer A, Sup A, Sup B, Officer B.

def get_token(username, password):
    resp = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if resp.status_code != 200:
        print(f"Failed to login {username}: {resp.text}")
        return None
    return resp.json()["access_token"]

def auth_header(token):
    return {"Authorization": f"Bearer {token}"}

def run_test():
    print("--- Starting Workflow Engine Test ---")
    
    # Login as Admin to setup data
    admin_token = get_token("admin", "admin123")
    if not admin_token:
        print("CRITICAL: Admin login failed. Ensure seeding ran.")
        return

    # 1. Create Template
    print("\n1. Creating 'Transfer Request' Template...")
    template_payload = {
        "name": "Transfer Request",
        "description": "Request to transfer supervision",
        "form_schema": {
            "fields": [
                {"name": "reason", "type": "text", "label": "Reason for Transfer"},
                {"name": "target_zip", "type": "text", "label": "New Zip Code"}
            ]
        }
    }
    resp = requests.post(f"{BASE_URL}/workflows/templates", json=template_payload, headers=auth_header(admin_token))
    if resp.status_code != 200:
        print(f"Failed to create template: {resp.text}")
        return
    template = resp.json()
    template_id = template["template_id"]
    print(f"   Template Created: {template_id}")

    # 2. Get an Offender to use
    print("\n2. Fetching an Offender...")
    resp = requests.get(f"{BASE_URL}/offenders?limit=1", headers=auth_header(admin_token))
    data = resp.json().get('data', [])
    if not data:
        print("No offenders found. Seed DB first.")
        return
    offender = data[0]
    offender_id = offender["id"]  # The API returns "id", not "offender_id"
    print(f"   Using Offender: {offender['name']} ({offender_id})")

    # 3. Create Submission (as Admin for convenience, or strictly speaking an Officer)
    # The Admin IS an officer in our seed.
    print("\n3. Creating Submission (Draft)...")
    sub_payload = {
        "template_id": template_id,
        "offender_id": offender_id,
        "form_data": {"reason": "Moving to Phoenix", "target_zip": "85001"}
    }
    resp = requests.post(f"{BASE_URL}/workflows/submissions", json=sub_payload, headers=auth_header(admin_token))
    submission = resp.json()
    sub_id = submission["submission_id"]
    print(f"   Submission Created: {sub_id} [Status: {submission['status']}]")

    # 4. Action: Submit
    print("\n4. Action: Submit (Officer -> Supervisor)...")
    action_payload = {"action": "Submit", "comment": "Ready for review"}
    resp = requests.put(f"{BASE_URL}/workflows/submissions/{sub_id}/action", json=action_payload, headers=auth_header(admin_token))
    submission = resp.json()
    print(f"   Status: {submission['status']}")
    print(f"   Assigned To: {submission['assigned_to_user_id']}")
    
    if submission['status'] != "Pending_Sup_Review":
        print("FAIL: Status did not change to Pending_Sup_Review")
        return

    # 5. Action: Return (Supervisor -> Officer)
    print("\n5. Action: Return (Supervisor -> Officer)...")
    action_payload = {"action": "Return", "comment": "Missing details"}
    resp = requests.put(f"{BASE_URL}/workflows/submissions/{sub_id}/action", json=action_payload, headers=auth_header(admin_token))
    submission = resp.json()
    print(f"   Status: {submission['status']}")
    
    if submission['status'] != "Correction_Needed":
        print("FAIL: Status did not change to Correction_Needed")
        return

    # 6. Action: Submit Again
    print("\n6. Action: Submit Again...")
    action_payload = {"action": "Submit", "comment": "Fixed"}
    resp = requests.put(f"{BASE_URL}/workflows/submissions/{sub_id}/action", json=action_payload, headers=auth_header(admin_token))
    submission = resp.json()
    print(f"   Status: {submission['status']}")

    # 7. Action: Approve (Sup -> Receiving Sup)
    # We need a target user ID. Let's just use Admin ID again for simplicity of the test logic, 
    # pretending Admin is the Receiving Sup.
    admin_user_id = submission['created_by_id'] # Admin created it.
    
    print("\n7. Action: Approve (Sup -> Receiving Sup)...")
    action_payload = {
        "action": "Approve", 
        "comment": "Looks good", 
        "target_user_id": admin_user_id 
    }
    resp = requests.put(f"{BASE_URL}/workflows/submissions/{sub_id}/action", json=action_payload, headers=auth_header(admin_token))
    submission = resp.json()
    print(f"   Status: {submission['status']}")

    if submission['status'] != "Pending_Receiving_Sup":
        print("FAIL: Status did not change to Pending_Receiving_Sup")
        return

    # 8. Action: Approve (Receiving Sup -> New Officer)
    print("\n8. Action: Approve (Receiving Sup -> New Officer)...")
    action_payload = {
        "action": "Approve", 
        "comment": "I accept the transfer",
        "target_user_id": admin_user_id
    }
    resp = requests.put(f"{BASE_URL}/workflows/submissions/{sub_id}/action", json=action_payload, headers=auth_header(admin_token))
    submission = resp.json()
    print(f"   Status: {submission['status']}")

    if submission['status'] != "Pending_New_Officer":
        print("FAIL: Status did not change to Pending_New_Officer")
        return

    # 9. Action: Accept (New Officer finalizes)
    print("\n9. Action: Accept (Completion)...")
    action_payload = {"action": "Accept", "comment": "Got it."}
    resp = requests.put(f"{BASE_URL}/workflows/submissions/{sub_id}/action", json=action_payload, headers=auth_header(admin_token))
    submission = resp.json()
    print(f"   Status: {submission['status']}")

    if submission['status'] != "Completed":
        print("FAIL: Status did not change to Completed")
        return

    print("\n--- TEST COMPLETED ---")

if __name__ == "__main__":
    run_test()
