import random
from datetime import datetime, timedelta
import uuid
import sys
from backend.database import SessionLocal, engine
from backend import models, auth

# Consts
OFFICES_COUNT = 6
OFFICERS_COUNT = 65
OFFENDERS_COUNT = 600

OFFICE_NAMES = ["Central HQ", "North Valley Precinct", "East Mesa Station", "Westside Outpost", "South Chandler Office", "Downtown Annex"]
FIRST_NAMES = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White"]

def seed_scale():
    db = SessionLocal()
    try:
        print("--- Starting Large Scale Seeding ---")
        
        # 1. Locations (Offices)
        current_locs = db.query(models.Location).all()
        print(f"Existing Locations: {len(current_locs)}")
        
        needed_locs = OFFICES_COUNT - len(current_locs)
        if needed_locs > 0:
            print(f"Creating {needed_locs} more offices...")
            for i in range(needed_locs):
                name = OFFICE_NAMES[len(current_locs) + i] if (len(current_locs) + i) < len(OFFICE_NAMES) else f"Office {len(current_locs) + i + 1}"
                loc = models.Location(
                    name=name,
                    address=f"{random.randint(100, 9999)} Mock St",
                    type="Branch",
                    zip_code=f"850{random.randint(10, 99)}"
                )
                db.add(loc)
            db.commit()
        
        locations = db.query(models.Location).all()
        
        # 2. Officers
        current_officers = db.query(models.Officer).all()
        print(f"Existing Officers: {len(current_officers)}")
        
        needed_officers = OFFICERS_COUNT - len(current_officers)
        if needed_officers > 0:
            print(f"Creating {needed_officers} more officers...")
            
            # Use 'Officer' role
            officer_role = db.query(models.Role).filter(models.Role.role_name == "Officer").first()
            if not officer_role:
                print("Error: Officer role not found. Run seed_initial_users.py first.")
                return

            pwd_hash = auth.get_password_hash("password123")
            
            for i in range(needed_officers):
                fn = random.choice(FIRST_NAMES)
                ln = random.choice(LAST_NAMES)
                username = f"{fn.lower()}.{ln.lower()}.{random.randint(100,999)}"
                
                # Check uniqueness
                if db.query(models.User).filter(models.User.username == username).first():
                    username = f"{username}{random.randint(1,9)}"
                
                user = models.User(
                    username=username,
                    email=f"{username}@agency.local",
                    password_hash=pwd_hash,
                    role_id=officer_role.role_id
                )
                db.add(user)
                db.flush()
                
                officer = models.Officer(
                    user_id=user.user_id,
                    location_id=random.choice(locations).location_id,
                    badge_number=f"BADGE-{random.randint(1000,9999)}-{i}",
                    first_name=fn,
                    last_name=ln,
                    phone_number=f"555-{random.randint(100,999)}-{random.randint(1000,9999)}"
                )
                db.add(officer)
                
            db.commit()

        officers = db.query(models.Officer).all()
        
        # 3. Offenders
        current_offenders = db.query(models.Offender).all()
        print(f"Existing Offenders: {len(current_offenders)}")
        
        needed_offenders = OFFENDERS_COUNT - len(current_offenders)
        if needed_offenders > 0:
            print(f"Creating {needed_offenders} more offenders...")
            
            for i in range(needed_offenders):
                fn = random.choice(FIRST_NAMES)
                ln = random.choice(LAST_NAMES)
                badge = f"DOC-{random.randint(100000, 999999)}"
                
                if db.query(models.Offender).filter(models.Offender.badge_id == badge).first():
                    continue

                offender = models.Offender(
                    badge_id=badge,
                    first_name=fn,
                    last_name=ln,
                    dob=datetime.now().date() - timedelta(days=random.randint(6500, 25000)),
                    gender=random.choice(["Male", "Female"]),
                    release_date=datetime.now().date() - timedelta(days=random.randint(10, 1000)),
                    csed_date=datetime.now().date() + timedelta(days=random.randint(100, 1500)),
                    employment_status=random.choice(["Employed", "Unemployed", "Unemployable", "Retired"]),
                    housing_status=random.choice(["Stable", "Transient", "Homeless", "Shelter"])
                    # case_manager_id removed
                )
                db.add(offender)
                db.flush()
                
                # Supervision Episode
                assigned_officer = random.choice(officers)
                episode = models.SupervisionEpisode(
                    offender_id=offender.offender_id,
                    assigned_officer_id=assigned_officer.officer_id,
                    start_date=datetime.now().date() - timedelta(days=random.randint(1, 400)),
                    status="Active",
                    risk_level_at_start=random.choice(["High", "Medium", "Low"]),
                    current_risk_level=random.choice(["High", "Medium", "Low"])
                )
                db.add(episode)

                # Add some random tasks
                if random.random() > 0.7:
                    task = models.Task(
                        title=random.choice(["Home Visit", "Drug Test", "Office Visit", "Employment Verification", "Collateral Contact"]),
                        description="Generated Task",
                        assigned_officer_id=assigned_officer.officer_id,
                        episode_id=episode.episode_id,
                        status="Pending",
                        due_date=datetime.now().date() + timedelta(days=random.randint(-5, 10)),
                        category="Home Visit", # Default for now
                        sub_category="Routine"
                    )
                    db.add(task)

            db.commit()

        print(f"Seeding Complete! \nTotal Offices: {len(db.query(models.Location).all())}\nTotal Officers: {len(db.query(models.Officer).all())}\nTotal Offenders: {len(db.query(models.Offender).all())}")

    except Exception as e:
        print(f"Error seeding scale data: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_scale()
