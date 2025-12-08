from backend import models, database, auth
from sqlalchemy.orm import Session

def reset_passwords():
    db = next(database.get_db())
    
    users = {
        "officer": "hash123",
        "supervisor": "hash123",
        "manager": "hash123",
        "admin": "admin123"
    }

    print("Resetting passwords...")
    for username, password in users.items():
        user = db.query(models.User).filter(models.User.username == username).first()
        if user:
            print(f"Updating password for {username}...")
            user.password_hash = auth.get_password_hash(password)
            db.add(user)
        else:
            print(f"User {username} not found (unexpected).")
    
    db.commit()
    print("Passwords credentials updated successfully.")

if __name__ == "__main__":
    reset_passwords()
