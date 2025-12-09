from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Offender, SupervisionEpisode, Officer
from backend.database import SQLALCHEMY_DATABASE_URL as DATABASE_URL

print(f"Connecting to: {DATABASE_URL}")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

offender_count = db.query(Offender).count()
episode_count = db.query(SupervisionEpisode).count()
active_episode_count = db.query(SupervisionEpisode).filter(SupervisionEpisode.status == 'Active').count()
officer_count = db.query(Officer).count()

print(f"Total Offenders: {offender_count}")
print(f"Total Episodes: {episode_count}")
print(f"Active Episodes: {active_episode_count}")
print(f"Total Officers: {officer_count}")

# Check assignments
if active_episode_count > 0:
    first_episode = db.query(SupervisionEpisode).filter(SupervisionEpisode.status == 'Active').first()
    print(f"Example Active Episode Assigned To: {first_episode.assigned_officer_id}")

    # Check who 'System Admin' is
    admin = db.query(Officer).filter(Officer.last_name == 'Admin').first()
    if admin:
        print(f"System Admin ID: {admin.officer_id}")
        
        # Check count for admin
        admin_count = db.query(SupervisionEpisode).filter(
            SupervisionEpisode.assigned_officer_id == admin.officer_id,
            SupervisionEpisode.status == 'Active'
        ).count()
        print(f"Active Episodes for System Admin: {admin_count}")
    else:
        print("System Admin user not found.")
