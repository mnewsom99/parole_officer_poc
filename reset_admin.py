from backend import models, auth, database
from sqlalchemy.orm import Session

def reset_password():
    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if user:
            print(f"Found user: {user.username}")
            user.password_hash = auth.get_password_hash("admin123")
            db.commit()
            print("Password reset to 'admin123'")
        else:
            print("User admin not found! Creating...")
            # Ensure Admin role exists
            admin_role = db.query(models.Role).filter(models.Role.role_name == "Admin").first()
            if not admin_role:
                print("Admin role missing! Creating...")
                admin_role = models.Role(role_name="Admin", role_id=3) # Assuming ID 3 from seed
                db.add(admin_role)
                db.commit()
            
            new_admin = models.User(
                username="admin",
                email="admin@system.local",
                password_hash=auth.get_password_hash("admin123"),
                role_id=admin_role.role_id
            )
            db.add(new_admin)
            db.commit()
            print("Admin user created with password 'admin123'")
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()
