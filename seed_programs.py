
import sys
import os
import uuid
from datetime import date, timedelta
import random

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend import models, database
from sqlalchemy.orm import Session

def seed_programs():
    db = next(database.get_db())
    
    print("Seeding Program Providers...")
    providers = [
        {"name": "Turning Point Recovery", "type": "External", "city": "Phoenix"},
        {"name": "Valley Hope", "type": "External", "city": "Tempe"},
        {"name": "Community Bridges", "type": "NGO", "city": "Mesa"}
    ]
    
    db_providers = []
    for p_data in providers:
        provider = db.query(models.ProgramProvider).filter_by(name=p_data["name"]).first()
        if not provider:
            provider = models.ProgramProvider(**p_data)
            db.add(provider)
            db.commit()
            db.refresh(provider)
        db_providers.append(provider)

    print("Seeding Program Offerings...")
    offerings_data = [
        {"program_name": "Intensive Outpatient", "category": "Substance Abuse", "provider_idx": 0},
        {"program_name": "Relapse Prevention", "category": "Substance Abuse", "provider_idx": 1},
        {"program_name": "Anger Management", "category": "Behavioral", "provider_idx": 2},
        {"program_name": "Life Skills", "category": "Education", "provider_idx": 1},
    ]

    db_offerings = []
    for o_data in offerings_data:
        provider = db_providers[o_data.pop("provider_idx")]
        offering = db.query(models.ProgramOffering).filter_by(program_name=o_data["program_name"]).first()
        if not offering:
            offering = models.ProgramOffering(**o_data, provider_id=provider.provider_id)
            db.add(offering)
            db.commit()
            db.refresh(offering)
        db_offerings.append(offering)

    print("Seeding Enrollments...")
    offenders = db.query(models.Offender).all()
    if not offenders:
        print("No offenders found to enroll.")
        return

    statuses = ["Enrolled", "Attending", "Discharged", "Completed"]
    
    for offender in offenders[:20]: # Enroll first 20 offenders
        # Check if already enrolled
        existing = db.query(models.ProgramEnrollment).filter_by(offender_id=offender.offender_id).first()
        if not existing:
            offering = random.choice(db_offerings)
            status = random.choice(statuses)
            start_date = date.today() - timedelta(days=random.randint(10, 100))
            
            enrollment = models.ProgramEnrollment(
                offender_id=offender.offender_id,
                offering_id=offering.offering_id,
                status=status,
                start_date=start_date,
                scheduled_end_date=start_date + timedelta(days=90),
                discharge_reason="Completed" if status == "Completed" else ("Non-Compliance" if status == "Discharged" else None)
            )
            db.add(enrollment)
    
    db.commit()
    print("Program Seeding Complete.")

if __name__ == "__main__":
    seed_programs()
