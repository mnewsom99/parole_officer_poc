from database import SessionLocal
from models import Task, Offender

def check_tasks():
    session = SessionLocal()
    try:
        # 1. Find Offender
        name = "Odonnell"
        offenders = session.query(Offender).filter(Offender.last_name.ilike(f"%{name}%")).all()
        print(f"Found {len(offenders)} offenders matching '{name}'")
        
        for off in offenders:
            print(f"--- Offender: {off.last_name}, {off.first_name} ({off.offender_id}) ---")
            
            # 2. Find Tasks
            tasks = session.query(Task).filter(Task.offender_id == off.offender_id).all()
            print(f"Total Tasks: {len(tasks)}")
            
            # 3. Breakdown
            parole_plan_cnt = sum(1 for t in tasks if t.is_parole_plan)
            regular_task_cnt = sum(1 for t in tasks if not t.is_parole_plan)
            print(f"  Parole Plan Tasks: {parole_plan_cnt}")
            print(f"  Regular Tasks: {regular_task_cnt}")
            if len(tasks) > 0:
                print("  Sample Tasks:")
                for t in tasks[:3]:
                    print(f"    - {t.title} (Status: {t.status}, ParolePlan: {t.is_parole_plan})")
                    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    check_tasks()
