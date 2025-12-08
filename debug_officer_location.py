from backend.database import SessionLocal
from backend import models

db = SessionLocal()

# Check Officer User
user = db.query(models.User).filter(models.User.username == 'officer').first()
if user:
    officer = db.query(models.Officer).filter(models.Officer.user_id == user.user_id).first()
    if officer:
        print(f"Officer: {officer.first_name} {officer.last_name}")
        print(f"  Officer ID: {officer.officer_id}")
        if officer.location:
            print(f"  Location: {officer.location.name} (ID: {officer.location.location_id})")
        else:
            print("  Location: SQLalchemy rel missing, checking ID")
            print(f"  Location ID: {officer.location_id}")
            loc = db.query(models.Location).filter(models.Location.location_id == officer.location_id).first()
            if loc:
                 print(f"  Location Name: {loc.name}")
            
        # Check Tasks for this officer
        tasks = db.query(models.Task).filter(models.Task.assigned_officer_id == officer.officer_id).all()
        print(f"  Task Count: {len(tasks)}")
        for t in tasks:
            # Check if task logic (backend) filters by location of the officer or the task? 
            # Backend checks task.assigned_officer.location_id
            pass
    else:
        print("Officer profile not found")
else:
    print("User 'officer' not found")
