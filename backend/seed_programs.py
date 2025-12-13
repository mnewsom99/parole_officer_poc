import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
from models import (
    ProgramProvider, ProgramOffering, ProgramEnrollment, 
    ProgramAttendance, ProgramNote, Offender
)

def seed_programs():
    db = SessionLocal()
    try:
        # 1. Create 5 Providers
        providers = [
            {
                "name": "Turning Point Recovery",
                "type": "External",
                "city": "Springfield",
                "offerings": [
                    {"name": "Intensive Outpatient Program (IOP)", "cat": "Substance Abuse", "care": "Intensive Outpatient", "type": "Group Therapy"},
                    {"name": "Relapse Prevention Group", "cat": "Substance Abuse", "care": "Outpatient (Low)", "type": "Group Therapy"},
                    {"name": "Family Support Workshop", "cat": "Family Services", "care": "Outpatient (Low)", "type": "Educational Class"}
                ]
            },
            {
                "name": "City Education Center",
                "type": "NGO",
                "city": "Springfield",
                "offerings": [
                    {"name": "GED Preparation Course", "cat": "Education / GED", "care": "Outpatient (Low)", "type": "Educational Class"},
                    {"name": "Adult Literacy Program", "cat": "Education / GED", "care": "Outpatient (Low)", "type": "Individual Counseling"},
                    {"name": "Computer Skills Basics", "cat": "Employment", "care": "Outpatient (Low)", "type": "Educational Class"}
                ]
            },
            {
                "name": "Pathways Counseling",
                "type": "Private",
                "city": "Shelbyville",
                "offerings": [
                    {"name": "Anger Management Level 1", "cat": "Anger Management", "care": "Outpatient (Low)", "type": "CBT (Cognitive Behavioral)"},
                    {"name": "Domestic Violence Intervention", "cat": "Domestic Violence", "care": "Outpatient (Low)", "type": "Group Therapy"},
                    {"name": "Individual Trauma Counseling", "cat": "Mental Health", "care": "Outpatient (Low)", "type": "Individual Counseling"}
                ]
            },
            {
                "name": "Veteran Services Bureau",
                "type": "Government",
                "city": "Capital City",
                "offerings": [
                    {"name": "Vet-to-Vet Mentorship", "cat": "Life Skills", "care": "Outpatient (Low)", "type": "Group Therapy"},
                    {"name": "PTSD Support Group", "cat": "Mental Health", "care": "Outpatient (Low)", "type": "Group Therapy"},
                    {"name": "Job Placement for Vets", "cat": "Employment", "care": "Outpatient (Low)", "type": "Individual Counseling"}
                ]
            },
            {
                "name": "Community Health Alliance",
                "type": "Internal",
                "city": "Springfield",
                "offerings": [
                    {"name": "Moral Reconation Therapy (MRT)", "cat": "Substance Abuse", "care": "Outpatient (Low)", "type": "MEP (Moral Reconation)"},
                    {"name": "Life Skills Workshop", "cat": "Life Skills", "care": "Outpatient (Low)", "type": "Educational Class"},
                    {"name": "Housing Assistance Intake", "cat": "Life Skills", "care": "Outpatient (Low)", "type": "Individual Counseling"}
                ]
            }
        ]

        created_offerings = []

        print("Creating Providers and Offerings...")
        for p_data in providers:
            provider = ProgramProvider(
                name=p_data["name"],
                type=p_data["type"],
                city=p_data["city"],
                status='Active'
            )
            db.add(provider)
            db.flush() # Get ID

            for off_data in p_data["offerings"]:
                offering = ProgramOffering(
                    provider_id=provider.provider_id,
                    program_name=off_data["name"],
                    category=off_data["cat"],
                    level_of_care=off_data["care"],
                    intervention_type=off_data["type"],
                    duration_weeks=12,
                    is_evidence_based=True if "CBT" in off_data["type"] or "MRT" in off_data["name"] else False,
                    description=f"A {off_data['cat']} program focusing on {off_data['type']}."
                )
                db.add(offering)
                created_offerings.append(offering)
        
        db.commit()

        # 2. Enroll 50% of Offenders
        offenders = db.query(Offender).all()
        target_count = int(len(offenders) * 0.5)
        selected_offenders = random.sample(offenders, target_count)

        print(f"Enrolling {target_count} offenders into programs...")

        statuses = ['Active', 'Active', 'Active', 'Referred', 'Completed', 'Discharged']
        
        for offender in selected_offenders:
            # Pick 1 or 2 programs
            programs_to_join = random.sample(created_offerings, k=random.randint(1, 2))
            
            for program in programs_to_join:
                status = random.choice(statuses)
                start_date = datetime.utcnow() - timedelta(days=random.randint(10, 60))
                
                enrollment = ProgramEnrollment(
                    offender_id=offender.offender_id,
                    offering_id=program.offering_id,
                    status=status,
                    referral_date=start_date - timedelta(days=7),
                    start_date=start_date if status != 'Referred' else None,
                    completion_status='Successful' if status == 'Completed' else None
                )
                
                db.add(enrollment)
                db.flush()

                # Add some history if active/completed
                if status in ['Active', 'Completed']:
                    # Add attendance
                    for i in range(3):
                        att_date = start_date + timedelta(days=i*7)
                        att = ProgramAttendance(
                            enrollment_id=enrollment.enrollment_id,
                            date=att_date,
                            status='Present',
                            comments="Participated well."
                        )
                        db.add(att)
                    
                    # Add a note
                    note = ProgramNote(
                        enrollment_id=enrollment.enrollment_id,
                        content=f"Offender is showing good progress in {program.program_name}.",
                        type="Progress"
                    )
                    db.add(note)

        db.commit()
        print("Seeding Complete!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_programs()
