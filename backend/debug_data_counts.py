from database import SessionLocal
import models
from sqlalchemy import func

db = SessionLocal()

# 1. Check Total Active Episodes
active_count = db.query(models.SupervisionEpisode).filter(models.SupervisionEpisode.status == 'Active').count()
print(f"Total Active Episodes: {active_count}")

# 2. Check Specific User by Badge
target_badge = "#SP-HighPro-100"
officer = db.query(models.Officer).filter(models.Officer.badge_number == target_badge).first()
if officer:
    print(f"Officer Found: {officer.first_name} {officer.last_name}")
    user = db.query(models.User).filter(models.User.user_id == officer.user_id).first()
    if user:
        if user.role:
             print(f"User Role: {user.role.role_name}")
        else:
             role = db.query(models.Role).filter(models.Role.role_id == user.role_id).first()
             print(f"User Role (manual): {role.role_name if role else 'None'}")
else:
    print(f"Officer with badge {target_badge} not found. Checking 'Admin' badge...")
    officer = db.query(models.Officer).filter(models.Officer.badge_number == "ADMIN").first()
    if officer:
         print(f"Admin Officer Found. Role ID: {officer.user.role_id}")


# 3. Check Officers
officers_count = db.query(models.Officer).count()
print(f"Total Officers: {officers_count}")
