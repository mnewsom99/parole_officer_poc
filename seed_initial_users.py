from backend import models, auth, database
from backend.database import SessionLocal

def seed_users():
    db = SessionLocal()
    try:
        print("Seeding initial users and roles...")
        # Seed Roles
        roles = ["Admin", "Manager", "Supervisor", "Officer"]
        for role_name in roles:
            role = db.query(models.Role).filter(models.Role.role_name == role_name).first()
            if not role:
                new_role = models.Role(role_name=role_name)
                db.add(new_role)
        db.commit()

        # Seed Default Admin User
        admin_role = db.query(models.Role).filter(models.Role.role_name == "Admin").first()
        if admin_role:
            existing_admin = db.query(models.User).filter(models.User.username == "admin").first()
            if not existing_admin:
                hashed_pwd = auth.get_password_hash("admin123")
                new_admin = models.User(
                    username="admin",
                    email="admin@system.local",
                    password_hash=hashed_pwd,
                    role_id=admin_role.role_id
                )
                db.add(new_admin)
                db.commit()

        # Ensure locations exist for officers
        location = db.query(models.Location).first()
        if not location:
            location = models.Location(name="Main Station", address="123 Main St", type="HQ")
            db.add(location)
            db.commit()
            db.refresh(location)
        
        # Ensure Admin has an Officer Profile
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        if admin_user:
            admin_officer = db.query(models.Officer).filter(models.Officer.user_id == admin_user.user_id).first()
            if not admin_officer:
                new_officer = models.Officer(
                    user_id=admin_user.user_id,
                    location_id=location.location_id,
                    badge_number="ADMIN",
                    first_name="Mike",
                    last_name="N",
                    phone_number=""
                )
                db.add(new_officer)
                db.commit()

        # Seed Other Roles with Officer Profiles
        roles_to_seed = ["Manager", "Supervisor", "Officer"]
        for r_name in roles_to_seed:
            role_obj = db.query(models.Role).filter(models.Role.role_name == r_name).first()
            if role_obj:
                username = r_name.lower()
                existing_user = db.query(models.User).filter(models.User.username == username).first()
                
                target_hash = auth.get_password_hash("hash123")
                
                if not existing_user:
                    new_user = models.User(
                        username=username,
                        email=f"{username}@system.local",
                        password_hash=target_hash,
                        role_id=role_obj.role_id
                    )
                    db.add(new_user)
                    db.flush() 

                    new_officer = models.Officer(
                        user_id=new_user.user_id,
                        location_id=location.location_id,
                        badge_number=f"BADGE-{username.upper()}",
                        first_name=r_name,
                        last_name="User",
                        phone_number="555-0000"
                    )
                    db.add(new_officer)
                    db.commit()
        
        print("Initial users seeded.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
