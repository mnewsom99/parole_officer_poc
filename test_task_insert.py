from backend.database import SessionLocal
from backend import models
import uuid

def test_insert():
    db = SessionLocal()
    try:
        # Get Officer
        officer = db.query(models.Officer).first()
        if not officer:
            print("No officer found")
            return

        print(f"Attempting to insert task for Officer {officer.officer_id} without Episode ID...")

        task = models.Task(
            task_id=uuid.uuid4(),
            title="Direct DB Test",
            assigned_officer_id=officer.officer_id,
            created_by=officer.officer_id,
            status="Pending",
            # episode_id is OMITTED
        )
        db.add(task)
        db.commit()
        print("SUCCESS: Task inserted!")
    except Exception as e:
        print(f"FAILURE: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_insert()
