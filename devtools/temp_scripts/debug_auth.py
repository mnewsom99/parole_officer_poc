from backend import models, database, auth
from sqlalchemy.orm import Session
from backend.database import get_db

db = next(get_db())

def check_user(username, password):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        print(f"User {username} not found!")
        return
    
    print(f"User: {username}")
    print(f"Stored Hash: {user.password_hash}")
    
    is_valid = auth.verify_password(password, user.password_hash)
    print(f"Password '{password}' valid? {is_valid}")

    # Generate what the hash SHOULD be
    new_hash = auth.get_password_hash(password)
    print(f"New Hash for '{password}': {new_hash}")

print("--- Checking Admin ---")
check_user('admin', 'admin123')

print("\n--- Checking Officer ---")
check_user('officer', 'hash123')
