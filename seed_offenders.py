import random
from datetime import datetime, timedelta
from backend.database import SessionLocal
from backend import models

def seed_offenders():
    db = SessionLocal()
    try:
        print("--- Seeding Offenders ---")
        
        # Get Officer to assign to
        officer = db.query(models.Officer).first()
        if not officer:
            print("No officer found. Run seed_initial_users.py first.")
            return

        # Create 20 Offenders
        first_names = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson"]
        
        for i in range(20):
            fn = random.choice(first_names)
            ln = random.choice(last_names)
            badge = f"OFF-{random.randint(10000, 99999)}"
            
            # Check exist
            if db.query(models.Offender).filter(models.Offender.badge_id == badge).first():
                continue

            offender = models.Offender(
                badge_id=badge,
                first_name=fn,
                last_name=ln,
                dob=datetime.now().date() - timedelta(days=random.randint(7000, 20000)),
                gender="Male",
                release_date=datetime.now().date() - timedelta(days=random.randint(0, 365)),
                csed_date=datetime.now().date() + timedelta(days=random.randint(365, 1000)),
                employment_status=random.choice(["Employed", "Unemployed", "Unemployable"]),
                housing_status=random.choice(["Stable", "Transient", "Homeless"])
            )
            db.add(offender)
            db.flush() # Get ID

            # Create Supervision Episode
            episode = models.SupervisionEpisode(
                offender_id=offender.offender_id,
                assigned_officer_id=officer.officer_id,
                start_date=datetime.now().date(),
                status="Active",
                risk_level_at_start="Medium",
                current_risk_level="Medium"
            )
            db.add(episode)
            
        db.commit()
        print("Offenders seeded successfully.")

    except Exception as e:
        print(f"Error seeding offenders: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_offenders()
