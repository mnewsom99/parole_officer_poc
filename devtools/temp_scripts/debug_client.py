from fastapi.testclient import TestClient
from backend.main import app

try:
    client = TestClient(app)
    print("TestClient created successfully")
except Exception as e:
    print(f"Error creating TestClient: {e}")
