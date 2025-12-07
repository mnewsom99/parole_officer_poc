
from backend.database import SessionLocal, engine
from backend.models import User
from backend.auth import get_password_hash

def reset_admin_password():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "admin").first()
        if user:
            print(f"Found user: {user.username}")
            user.password_hash = get_password_hash("admin123")
            db.commit()
            print("Password updated to 'admin123'")
        else:
            print("User 'admin' not found!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin_password()
