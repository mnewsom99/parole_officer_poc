import requests
import json

BASE_URL = "http://localhost:8000"

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login failed: {response.text}")
    return None

def get_current_user(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    return response.json()

def get_officer_details(token, user_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/users/{user_id}/officer", headers=headers)
    if response.status_code == 200:
        return response.json()
    print(f"Get Officer failed: {response.text}")
    return None

def update_officer(token, officer_id, first_name, last_name):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    data = {
        "first_name": first_name,
        "last_name": last_name
    }
    response = requests.put(f"{BASE_URL}/officers/{officer_id}", headers=headers, json=data)
    if response.status_code == 200:
        return response.json()
    print(f"Update failed: {response.text}")
    return None

def main():
    # 1. Login
    print("Logging in...")
    token = login("admin", "admin123")
    if not token: exit()

    # 2. Get User & Officer ID
    user = get_current_user(token)
    print(f"User found: {user['username']} (ID: {user['user_id']})")
    
    officer = get_officer_details(token, user['user_id'])
    if not officer:
        print("No officer record found for this user!")
        exit()
    
    print(f"Current Name: {officer['first_name']} {officer['last_name']}")
    
    # 3. Update Name
    new_first = "Michael"
    new_last = "AdminUpdated"
    print(f"Updating to: {new_first} {new_last}...")
    
    updated = update_officer(token, officer['officer_id'], new_first, new_last)
    
    # 4. Verify
    print("Verifying persistence...")
    officer_check = get_officer_details(token, user['user_id'])
    print(f"New Name in DB: {officer_check['first_name']} {officer_check['last_name']}")
    
    if officer_check['first_name'] == new_first and officer_check['last_name'] == new_last:
        print("SUCCESS: Backend persistence is working.")
    else:
        print("FAILURE: Changes did not persist.")

if __name__ == "__main__":
    main()
