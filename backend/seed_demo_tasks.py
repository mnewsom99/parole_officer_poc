from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
from datetime import datetime, timedelta
import random

def seed_demo_tasks():
    db: Session = SessionLocal()
    try:
        # Define demo users to seed
        demo_usernames = ["admin", "manager", "supervisor", "officer"]
        
        # Task Templates
        task_templates = [
            {"title": "Review Case File", "desc": "Review monthly progress and notes.", "priority": "Normal"},
            {"title": "Home Visit Required", "desc": "Schedule and conduct diverse home visit.", "priority": "High"},
            {"title": "Update Risk Assessment", "desc": "Perform semi-annual risk assessment.", "priority": "Normal"},
            {"title": "Verify Employment", "desc": "Call employer to verify current status.", "priority": "Low"},
            {"title": "Court Appearance Prep", "desc": "Prepare documents for upcoming hearing.", "priority": "High"},
            {"title": "Drug Test Referral", "desc": "Generate referral for random UA.", "priority": "Normal"},
            {"title": "Respond to Inquiry", "desc": "Reply to agency regarding offender status.", "priority": "Normal"},
        ]

        print("Starting demo task seed...")

        for username in demo_usernames:
            # 1. Find User
            user = db.query(models.User).filter(models.User.username == username).first()
            if not user:
                print(f"User {username} not found, skipping.")
                continue

            # 2. Find Officer Profile
            officer = db.query(models.Officer).filter(models.Officer.user_id == user.user_id).first()
            if not officer:
                print(f"Officer profile for {username} not found, skipping.")
                continue

            print(f"Seeding tasks for {officer.first_name} {officer.last_name} ({username})...")

            # 3. Find some episodes or create generic tasks
            # We'll assign tasks to the officer. Ideally linked to an episode, but can be general if null episode allowed?
            # Model: episode_id = Column(UUID(as_uuid=True), ForeignKey('supervision_episodes.episode_id'), index=True)
            # It seems NOT nullable in the model definition? 
            # Wait, line 108: episode_id = ... ForeignKey... 
            # It doesn't explicitly say nullable=False, so default is nullable=True usually in SQLAlchemy unless specified.
            # Let's check `backend/models.py`.
            # Line 108: episode_id = Column(UUID(as_uuid=True), ForeignKey('supervision_episodes.episode_id'), index=True)
            # It does NOT have nullable=False. So we can create general tasks.
            # However, for realism, let's try to find an episode if possible, or just create general ones.
            
            # Let's create 5-8 tasks
            count = random.randint(5, 8)
            for i in range(count):
                template = random.choice(task_templates)
                
                # Random due date: -5 days to +10 days
                days_offset = random.randint(-5, 10)
                due_date = datetime.now().date() + timedelta(days=days_offset)
                
                status = "Pending"
                if days_offset < 0:
                    status = "Overdue" # Not a valid DB status enum usually, usually just Pending but date is old
                    # Model default='Pending'. Valid statuses? UI uses Pending, In Progress, Completed.
                    status = random.choice(["Pending", "In Progress", "Completed"])
                else:
                    status = random.choice(["Pending", "In Progress"])

                task = models.Task(
                    created_by=officer.officer_id,
                    assigned_officer_id=officer.officer_id,
                    title=template["title"],
                    description=template["desc"],
                    due_date=due_date,
                    status=status
                    # episode_id=None # General task
                )
                db.add(task)
            
            print(f"  - Added {count} tasks.")

        db.commit()
        print("Demo task seeding complete.")

    except Exception as e:
        print(f"Error seeding tasks: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_tasks()
