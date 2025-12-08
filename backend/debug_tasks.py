from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models

def debug_tasks():
    db = SessionLocal()
    try:
        total_tasks = db.query(models.Task).count()
        print(f"Total Tasks in DB: {total_tasks}")
        
        if total_tasks > 0:
            assigned_tasks = db.query(models.Task).filter(models.Task.assigned_officer_id != None).count()
            print(f"Tasks with assigned_officer_id: {assigned_tasks}")
            
            unassigned_tasks = db.query(models.Task).filter(models.Task.assigned_officer_id == None).count()
            print(f"Tasks WITHOUT assigned_officer_id: {unassigned_tasks}")
            
            print("\n--- First 5 Tasks ---")
            tasks = db.query(models.Task).limit(5).all()
            for t in tasks:
                print(f"ID: {t.task_id}, Title: {t.title}, Assigned: {t.assigned_officer_id}, Status: {t.status}")
                
            print("\n--- Officers ---")
            officer_count = db.query(models.Officer).count()
            print(f"Total Officers: {officer_count}")
        else:
            print("WARNING: No tasks found in database.")
            
    finally:
        db.close()

if __name__ == "__main__":
    debug_tasks()
