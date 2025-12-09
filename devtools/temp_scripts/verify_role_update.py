import requests

API_URL = "http://localhost:8000"
TOKEN = None

def login():
    global TOKEN
    response = requests.post(f"{API_URL}/token", data={"username": "admin", "password": "admin123"})
    if response.status_code == 200:
        TOKEN = response.json()["access_token"]
        print("Login successful")
    else:
        print(f"Login failed: {response.text}")

def get_user_role(username):
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = requests.get(f"{API_URL}/users", headers=headers)
    if response.status_code == 200:
        users = response.json()
        for u in users:
            if u["username"] == username:
                return u["role"]["role_name"] if u["role"] else "None"
    return "User Not Found"

def update_role(username, role_name):
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # 1. Get User ID
    response = requests.get(f"{API_URL}/users", headers=headers)
    user_id = None
    for u in response.json():
        if u["username"] == username:
            user_id = u["user_id"]
            break
            
    if not user_id:
        print("User not found")
        return

    # 2. Get Role ID
    r_res = requests.get(f"{API_URL}/roles", headers=headers)
    role_id = None
    for r in r_res.json():
        if r["role_name"] == role_name:
            role_id = r["role_id"]
            break
            
    if not role_id:
        print("Role not found")
        return

    # 3. Update
    print(f"Updating {username} ({user_id}) to role {role_name} ({role_id})...")
    res = requests.put(f"{API_URL}/users/{user_id}/role", json={"role_id": role_id}, headers=headers)
    print(f"Update response: {res.status_code} {res.text}")

login()
print(f"Current role for po.north.1: {get_user_role('po.north.1')}")
update_role("po.north.1", "Supervisor")
print(f"New role for po.north.1: {get_user_role('po.north.1')}")
