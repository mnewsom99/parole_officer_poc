import os
import sys

# Ensure we can import backend modules
sys.path.append(os.getcwd())

from backend import models, database, auth
from backend.database import engine, SessionLocal

def reset_db():
    print("--- Resetting Database ---")
    db_file = "parole_app.db"
    
    # Try to delete existing DB
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"Deleted {db_file}")
        except Exception as e:
            print(f"Error deleting {db_file}: {e}")
            return False

    # Create Tables
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Seed Roles
        print("Seeding roles...")
        roles = ["Admin", "Manager", "Supervisor", "Officer"]
        for r in roles:
            db.add(models.Role(role_name=r))
        db.commit()

        # Seed Users
        print("Seeding users...")
        
        # Admin
        admin_role = db.query(models.Role).filter(models.Role.role_name == "Admin").first()
        admin_hash = auth.get_password_hash("admin123")
        admin = models.User(
            username="admin", 
            email="admin@system.local", 
            password_hash=admin_hash, 
            role_id=admin_role.role_id
        )
        db.add(admin)
        
        # Officer
        officer_role = db.query(models.Role).filter(models.Role.role_name == "Officer").first()
        officer_hash = auth.get_password_hash("hash123")
        officer = models.User(
            username="officer", 
            email="officer@system.local", 
            password_hash=officer_hash, 
            role_id=officer_role.role_id
        )
        db.add(officer)
        
        # Location for Officer
        loc = models.Location(name="HQ", address="123 Main", type="HQ")
        db.add(loc)
        db.commit() # Commit to get IDs
        
        # Officer Profile
        profile = models.Officer(
            user_id=officer.user_id,
            location_id=loc.location_id,
            badge_number="BADGE-OFFICER",
            first_name="Officer",
            last_name="User"
        )
        db.add(profile)
        db.commit()
        
        print("Seeding complete.")
        
        # Verify
        print("\n--- Verifying ---")
        u = db.query(models.User).filter(models.User.username == "officer").first()
        if u and auth.verify_password("hash123", u.password_hash):
            print("SUCCESS: Officer login verified!")
        else:
            print(f"FAILURE: Officer login check failed. Hash matches? {auth.verify_password('hash123', u.password_hash) if u else 'No User'}")

        a = db.query(models.User).filter(models.User.username == "admin").first()
        if a and auth.verify_password("admin123", a.password_hash):
            print("SUCCESS: Admin login verified!")
        else:
            print("FAILURE: Admin login check failed.")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_db()
