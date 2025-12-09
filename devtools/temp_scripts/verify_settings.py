from backend import models, database, tasks
from datetime import date, timedelta

def verify():
    db = database.SessionLocal()
    try:
        print("Verifying SystemSettings...")
        setting = db.query(models.SystemSettings).filter_by(key='onboarding_due_delay').first()
        if setting:
            print(f"Found setting: {setting.key} = {setting.value}")
        else:
            print("ERROR: Setting not found!")
            return

        print("\nTesting Task Assignment...")
        # Create a dummy offender and episode
        offender = models.Offender(
            badge_id="TEST-999",
            first_name="Test",
            last_name="User",
            dob=date(1990, 1, 1)
        )
        db.add(offender)
        db.flush()

        episode = models.SupervisionEpisode(
            offender_id=offender.offender_id,
            assigned_officer_id=None, # Skip for test
            start_date=date.today(),
            status="Active",
            risk_level_at_start="Low"
        )
        db.add(episode)
        db.commit()
        
        # Run task assignment
        print("Running assign_onboarding_tasks...")
        task = tasks.assign_onboarding_tasks(episode.episode_id, db)
        
        if task:
            print(f"Task created: {task.title}")
            print(f"Due Date: {task.due_date}")
            
            expected_date = date.today() + timedelta(days=int(setting.value))
            if task.due_date == expected_date:
                print("SUCCESS: Due date matches setting!")
            else:
                print(f"FAILURE: Expected {expected_date}, got {task.due_date}")
        else:
            print("ERROR: Task not created!")

        # Cleanup
        db.delete(task)
        db.delete(episode)
        db.delete(offender)
        db.commit()

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
