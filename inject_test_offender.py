from datetime import datetime, timedelta
from backend.database import SessionLocal
from backend import models
import uuid

def inject_test_offender():
    db = SessionLocal()
    try:
        # Create a test officer if needed
        officer = db.query(models.Officer).first()
        if not officer:
            print("No officer found, cannot assign.")
            return

        today = datetime.now().date()

        # Create Test Offender
        # Rule 1 Criteria: Release Date around now (Target = Release + 2)
        # Rule 2 Criteria: Risk High + Release Date around 45 days ago (Target = Release + 45)
        # This conflict means we might need 2 offenders or one that fits multiple? 
        # Rule 2 needs release date to be ~45 days ago for it to be due "now". 
        # Rule 1 needs release date to be "now" for it to be due "in 2 days".
        # Let's create TWO test offenders to test different triggers.

        # Offender 1: Fresh Release (Triggers Home Visit)
        off1 = models.Offender(
            badge_id=f"TEST-{uuid.uuid4().hex[:6]}",
            first_name="Test",
            last_name="Fresh-Release",
            dob=datetime(1980, 1, 1).date(),
            # email/phone/address/risk_level removed as they don't exist in model
            image_url="https://randomuser.me/api/portraits/men/1.jpg",
            release_date=(today - timedelta(days=0)).strftime("%Y-%m-%d"), # Released Today
            csed_date=(today + timedelta(days=365)).strftime("%Y-%m-%d"),
            special_flags=[]
        )
        db.add(off1)
        db.flush() 

        # Episode for Offender 1
        ep1 = models.SupervisionEpisode(
            offender_id=off1.offender_id,
            start_date=today,
            status="Active",
            assigned_officer_id=officer.officer_id,
            risk_level_at_start="Low",
            current_risk_level="Low"
        )
        db.add(ep1)

        # Offender 2: Mid-Term (Triggers Risk Review)
        off2 = models.Offender(
            badge_id=f"TEST-{uuid.uuid4().hex[:6]}",
            first_name="Test",
            last_name="Risk-Review",
            dob=datetime(1985, 5, 5).date(),
            image_url="https://randomuser.me/api/portraits/men/2.jpg",
            release_date=(today - timedelta(days=45)).strftime("%Y-%m-%d"), # Released 45 days ago
            csed_date=(today + timedelta(days=200)).strftime("%Y-%m-%d"),
            special_flags=[]
        )
        db.add(off2)
        db.flush()

        ep2 = models.SupervisionEpisode(
            offender_id=off2.offender_id,
            start_date=today - timedelta(days=45),
            status="Active",
            assigned_officer_id=officer.officer_id,
            risk_level_at_start="High",
            current_risk_level="High" # Triggers Rule 2
        )
        db.add(ep2)

        # Offender 3: Expiring (Triggers Closeout)
        off3 = models.Offender(
            badge_id=f"TEST-{uuid.uuid4().hex[:6]}",
            first_name="Test",
            last_name="Closing-Soon",
            dob=datetime(1990, 12, 12).date(),
            image_url="https://randomuser.me/api/portraits/men/3.jpg",
            release_date=(today - timedelta(days=365)).strftime("%Y-%m-%d"), 
            csed_date=(today + timedelta(days=2)).strftime("%Y-%m-%d"), # Expires in 2 days? Or Today? Rule says "on CSED date".
            # Automation logic: csed_date >= today - 30. So upcoming or recent.
            special_flags=[]
        )
        db.add(off3)
        db.flush()

        ep3 = models.SupervisionEpisode(
            offender_id=off3.offender_id,
            start_date=today - timedelta(days=365),
            status="Active",
            assigned_officer_id=officer.officer_id,
            risk_level_at_start="Low",
            current_risk_level="Low"
        )
        db.add(ep3)

        db.commit()
        print("Injected 3 Test Offenders.")

    finally:
        db.close()

if __name__ == "__main__":
    inject_test_offender()
