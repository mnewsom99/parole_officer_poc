from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from celery import Celery
from celery.schedules import crontab
import os
from . import models

# Initialize Celery
celery_app = Celery(
    "worker",
    broker=os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

# Configure Beat Schedule
celery_app.conf.beat_schedule = {
    "generate-daily-warrant-check": {
        "task": "backend.tasks.generate_daily_warrant_check",
        "schedule": crontab(hour=2, minute=0), # Run at 2:00 AM
    },
}
celery_app.conf.timezone = 'UTC'

@celery_app.task
def generate_daily_warrant_check():
    """
    Simulates a daily warrant check.
    """
    print(f"[{datetime.utcnow()}] Running daily warrant check...")
    return "Warrant check completed"

def assign_onboarding_tasks(episode_id: str, db: Session):
    """
    Assigns onboarding tasks to an offender based on their supervision episode.
    Queries SystemSettings for the due date delay.
    """
    # Get the episode
    episode = db.query(models.SupervisionEpisode).filter(models.SupervisionEpisode.episode_id == episode_id).first()
    if not episode:
        return

    # Get delay from settings
    delay_setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == 'onboarding_due_delay').first()
    
    try:
        delay_days = int(delay_setting.value) if delay_setting else 3
    except ValueError:
        delay_days = 3

    # Calculate due date
    due_date = episode.start_date + timedelta(days=delay_days)

    # Create the task
    task = models.Task(
        episode_id=episode_id,
        title="Complete Onboarding",
        description="Complete initial intake and onboarding process.",
        due_date=due_date,
        status="Pending",
        created_by=episode.assigned_officer_id 
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    return task
