from backend.database import SessionLocal
from backend import models

db = SessionLocal()
task_count = db.query(models.Task).count()
print(f"Total tasks in database: {task_count}")

# Check tasks for some officers
officers = db.query(models.Officer).all()
for officer in officers:
    tasks = db.query(models.Task).filter(models.Task.assigned_officer_id == officer.officer_id).count()
    print(f"Officer {officer.first_name} {officer.last_name} (ID: {officer.officer_id}) has {tasks} tasks.")
