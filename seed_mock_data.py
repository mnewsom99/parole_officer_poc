import random
from datetime import datetime, timedelta, time
from backend.database import SessionLocal
from backend import models

def seed_calendar_tasks():
    # Phase 1: Read IDs
    db_read = SessionLocal()
    try:
        print("Reading existing officers/offenders...")
        officers = []
        for o in db_read.query(models.Officer).all():
            officers.append({
                "officer_id": o.officer_id,
                "user_id": o.user_id,
                "first_name": o.first_name,
                "last_name": o.last_name
            })
            
        offenders = []
        for off in db_read.query(models.Offender).all():
            offenders.append({
                "offender_id": off.offender_id,
                "address": "123 Main St, Phoenix AZ" # Fallback
            })
    finally:
        db_read.close()

    if not officers or not offenders:
        print("No officers or offenders found. Cannot seed.")
        return

    # Phase 2: Write Data
    db_write = SessionLocal()
    try:
        print(f"Seeding with {len(officers)} officers and {len(offenders)} offenders...")
        
        # Clear existing
        db_write.query(models.Task).delete()
        db_write.query(models.Appointment).delete()
        
        # Create Tasks
        task_templates = [
            ("Review Monthly Report", "High", "Office", "Paperwork"),
            ("Update Risk Assessment", "Normal", "Risk Assessment", "Re-assessment"),
            ("Approve Home Plan", "Normal", "Home Visit", "Prehome"),
            ("Contact Victim Advocate", "High", "Other", "Victim Services"),
            ("Verify Employment", "Normal", "Employment", "Verification"),
            ("Routine File Audit", "Low", "Office", "Audit")
        ]
        
        for _ in range(30):
            officer = random.choice(officers)
            tpl = random.choice(task_templates)
            days_offset = random.randint(-5, 15)
            due_date = datetime.now() + timedelta(days=days_offset)
            
            # Use user_id if available, otherwise just skip or use None (which might fail if non-nullable)
            assigned_uid = officer["user_id"]
            
            task = models.Task(
                title=tpl[0],
                description=f"Task for {officer['first_name']} {officer['last_name']}",
                assigned_officer_id=officer["officer_id"],
                category=tpl[2],
                sub_category=tpl[3],
                status=random.choice(["Pending", "In Progress", "Completed"]),
                due_date=due_date,
                created_at=datetime.now()
            )
            
            db_write.add(task)

        # Create Appointments
        appt_types = ["Office Visit", "Home Visit", "Court Hearing", "Drug Test"]
        
        for _ in range(50):
            officer = random.choice(officers)
            offender = random.choice(offenders)
            appt_type = random.choice(appt_types)
            
            days_offset = random.randint(-10, 20)
            appt_date = datetime.now().date() + timedelta(days=days_offset)
            appt_time = time(random.randint(9, 16), random.choice([0, 15, 30, 45]))
            dt = datetime.combine(appt_date, appt_time)
            
            appt = models.Appointment(
                officer_id=officer["officer_id"],
                offender_id=offender["offender_id"],
                type=appt_type,
                date_time=dt,
                location="Main Office" if appt_type == "Office Visit" else offender["address"],
                notes="Generated appointment",
                status="Scheduled"
            )
            db_write.add(appt)

        db_write.commit()
        print("Seeding Complete!")

    except Exception as e:
        print(f"Error: {e}")
        db_write.rollback()
    finally:
        db_write.close()

if __name__ == "__main__":
    seed_calendar_tasks()
