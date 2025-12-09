import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from uuid import UUID

# Setup path
sys.path.append(os.getcwd())

# Correct imports based on usual structure, checking file content next if this fails
from backend.database import get_db
from backend.models import Base, Officer, Task
# Note: Base is often in database.py but models.py sometimes defines it or imports it.
# If database.py doesn't have it, models.py likely does.

# Connect to DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./parole_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def debug_filters():
    print("--- Debugging Officer Filter ---")
    
    # 1. Find Amy Taylor
    officer = db.query(Officer).filter(Officer.first_name == "Amy", Officer.last_name == "Taylor").first()
    
    if not officer:
        print("Officer Amy Taylor NOT FOUND")
        return

    print(f"Found Officer: {officer.first_name} {officer.last_name}")
    print(f"Officer ID: {officer.officer_id}")
    print(f"User ID: {officer.user_id}")
    print(f"Location ID: {officer.location_id}")

    # 2. Count Tasks for this officer (Direct DB count)
    task_count = db.query(Task).filter(Task.assigned_officer_id == officer.officer_id).count()
    print(f"Direct Task Count (by assigned_officer_id): {task_count}")

    # 3. Test Query Logic (String ID)
    officer_id_str = str(officer.officer_id)
    
    query = db.query(Task)
    query = query.filter(Task.assigned_officer_id == officer_id_str)
    api_sim_count = query.count()
    print(f"API Simulation Task Count (using string ID): {api_sim_count}")
    
    # 4. List sample tasks
    tasks = query.limit(5).all()
    print(f"Sample Tasks: {len(tasks)}")
    for t in tasks:
        print(f" - {t.title} (Assigned: {t.assigned_officer_id})")

if __name__ == "__main__":
    try:
        debug_filters()
    finally:
        db.close()
