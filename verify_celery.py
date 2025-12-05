from backend.tasks import celery_app

def verify_celery():
    print("Verifying Celery Configuration...")
    
    # Check Broker URL
    print(f"Broker: {celery_app.conf.broker_url}")
    
    # Check Schedule
    schedule = celery_app.conf.beat_schedule
    if "generate-daily-warrant-check" in schedule:
        task_config = schedule["generate-daily-warrant-check"]
        print(f"Found scheduled task: {task_config['task']}")
        print(f"Schedule: {task_config['schedule']}")
    else:
        print("ERROR: Scheduled task not found!")

    # Check Task Registry
    if "backend.tasks.generate_daily_warrant_check" in celery_app.tasks:
        print("Task registered successfully.")
    else:
        print("ERROR: Task not registered!")

if __name__ == "__main__":
    verify_celery()
