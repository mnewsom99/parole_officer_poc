import sys
import os
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models, auth

def check_login(username, password):
    print(f"Checking login for: {username}")
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            print(f"User '{username}' NOT FOUND.")
            return False
        
        print(f"User found: {user.username}, Hash: {user.password_hash}")
        is_valid = auth.verify_password(password, user.password_hash)
        print(f"Password '{password}' valid? {is_valid}")
        return is_valid
    finally:
        db.close()

if __name__ == "__main__":
    print(f"CWD: {os.getcwd()}")
    print(f"DB File Exists? {os.path.exists('parole_app.db')}")
    
    check_login("admin", "admin123")
    check_login("officer", "hash123")
