from database import SessionLocal
from models import Task
from sqlalchemy import func

def check_task_stats():
    session = SessionLocal()
    try:
        total = session.query(Task).count()
        with_offender = session.query(Task).filter(Task.offender_id.isnot(None)).count()
        without_offender = session.query(Task).filter(Task.offender_id.is_(None)).count()
        
        print(f"Total Tasks: {total}")
        print(f"Tasks WITH Offender ID: {with_offender}")
        print(f"Tasks WITHOUT Offender ID: {without_offender}")
        
        if with_offender > 0:
            print("Sample of tasks with offender_id:")
            sample = session.query(Task).filter(Task.offender_id.isnot(None)).limit(5).all()
            for t in sample:
                print(f" - {t.title} (OffenderID: {t.offender_id})")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    check_task_stats()
