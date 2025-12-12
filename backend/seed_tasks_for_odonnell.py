from database import SessionLocal
from models import Task, Offender, Officer
import datetime

def seed_tasks():
    session = SessionLocal()
    try:
        # 1. Find Offender
        name = "Odonnell"
        offender = session.query(Offender).filter(Offender.last_name.ilike(f"%{name}%")).first()
        if not offender:
            print("Offender not found")
            return

        # 2. Find an Officer (Assignee)
        officer = session.query(Officer).first()
        
        # 3. Create Tasks
        t1 = Task(
            offender_id=offender.offender_id,
            assigned_officer_id=officer.officer_id,
            title="Verify Employment Details",
            description="Call employer to verify hours.",
            due_date=datetime.date.today(),
            status="Pending",
            is_parole_plan=False
        )
        
        t2 = Task(
            offender_id=offender.offender_id,
            assigned_officer_id=officer.officer_id,
            title="Complete Anger Management",
            description="Parole condition requirement.",
            due_date=datetime.date.today() + datetime.timedelta(days=30),
            status="Pending",
            is_parole_plan=True
        )

        session.add(t1)
        session.add(t2)
        session.commit()
        print(f"Created 2 tasks for {offender.first_name} {offender.last_name}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    seed_tasks()
