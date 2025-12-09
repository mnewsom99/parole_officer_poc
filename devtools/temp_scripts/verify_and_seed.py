import sys
import os
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup path
sys.path.append(os.getcwd())

# Import from backend
from backend.models import Officer, Task, Base
from backend.database import get_db

# Load env for DB URL
from dotenv import load_dotenv
load_dotenv()

# DB Connection
SQLALCHEMY_DATABASE_URL = os.getenv("POSTGRES_URL", "sqlite:///./parole_app.db")
print(f"Connecting to: {SQLALCHEMY_DATABASE_URL}")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def verify_and_seed():
    print("--- Verifying and Seeding Tasks ---")
    
    officers = db.query(Officer).all()
    print(f"Total Officers: {len(officers)}")
    
    seeded_count = 0
    
    for officer in officers:
        task_count = db.query(Task).filter(Task.assigned_officer_id == officer.officer_id).count()
        print(f"Officer: {officer.first_name} {officer.last_name} | Tasks: {task_count}")
        
        if task_count < 5:
            print(f" -> Seeding tasks for {officer.first_name}...")
            
            # Generate 5-8 tasks
            num_new = random.randint(5, 8)
            for _ in range(num_new):
                days_offset = random.randint(-5, 30)
                due = datetime.now().date() + timedelta(days=days_offset)
                
                status = "Pending"
                if days_offset < 0:
                    status = random.choice(["Completed", "Pending", "Overdue"]) # Overdue logic isn't auto, just a label potentially
                    if status == "Overdue": status = "Pending" # Simplification
                
                new_task = Task(
                    title=random.choice([
                        "Review Monthly Report", "Home Visit", "Update Risk Assessment", 
                        "Court Hearing Preparation", "Drug Test Verification", "Employment Check"
                    ]),
                    description="Auto-generated task for demo purposes.",
                    due_date=due,
                    status=status,
                    assigned_officer_id=officer.officer_id,
                    created_by=officer.officer_id # Self-assigned for simplicity
                )
                db.add(new_task)
            
            seeded_count += 1
            
    db.commit()
    print("--- Done ---")
    print(f"Seeded tasks for {seeded_count} officers.")

if __name__ == "__main__":
    try:
        verify_and_seed()
    finally:
        db.close()
