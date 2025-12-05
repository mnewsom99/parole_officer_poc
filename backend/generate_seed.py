from faker import Faker
import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import itertools
from . import models, database

fake = Faker()

def generate_seed_data():
    db = database.SessionLocal()
    
    try:
        # Clear existing data
        print("Clearing existing data...")
        db.query(models.Task).delete()
        db.query(models.SupervisionEpisode).delete()
        db.query(models.Offender).delete()
        db.query(models.Officer).delete()
        db.query(models.User).delete()
        db.query(models.Location).delete()
        db.query(models.Urinalysis).delete()
        db.query(models.CaseNote).delete()
        db.query(models.RiskAssessment).delete()
        db.query(models.Appointment).delete()
        db.query(models.Facility).delete()
        db.query(models.Facility).delete()
        db.query(models.Role).delete()
        db.query(models.SystemSettings).delete()
        db.commit()

        # Generate Roles
        roles = ['Officer', 'Supervisor', 'Admin']
        role_map = {}
        for i, role_name in enumerate(roles, 1):
            role = models.Role(role_id=i, role_name=role_name, description=f"Role for {role_name}")
            db.add(role)
            role_map[role_name] = i
        db.commit()

        # Generate System Settings
        import json
        note_types_config = [
            {"name": "General", "color": "bg-slate-100 text-slate-700"},
            {"name": "Home Visit", "color": "bg-blue-100 text-blue-700"},
            {"name": "Field Visit", "color": "bg-green-100 text-green-700"},
            {"name": "Office Visit", "color": "bg-purple-100 text-purple-700"},
            {"name": "Violation", "color": "bg-red-100 text-red-700"},
            {"name": "Phone Call", "color": "bg-yellow-100 text-yellow-700"}
        ]

        settings = [
            models.SystemSettings(
                key='onboarding_due_delay',
                value='3',
                description='Days after start date when onboarding is due'
            ),
            models.SystemSettings(
                key='note_types',
                value=json.dumps(note_types_config),
                description='Configuration for case note types and colors'
            )
        ]
        db.add_all(settings)
        db.commit()

        # Generate Offices
        office_names = ["North", "South", "East", "West"]
        offices = {}
        for name in office_names:
            loc = models.Location(
                name=f"{name} Field Office",
                address=f"{fake.building_number()} {name} St, {fake.city()}",
                type='Field Office'
            )
            db.add(loc)
            offices[name] = loc
        db.commit()

        # Generate Supervisors (One per office)
        supervisors = {}
        for name, office in offices.items():
            user = models.User(
                username=f"sup_{name.lower()}",
                email=f"sup.{name.lower()}@example.com",
                password_hash='hash123',
                role_id=role_map['Supervisor']
            )
            db.add(user)
            db.flush()

            sup = models.Officer(
                user_id=user.user_id,
                location_id=office.location_id,
                badge_number=f"SUP-{name[0]}-{random.randint(100, 999)}",
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone_number=fake.phone_number()
            )
            db.add(sup)
            supervisors[name] = sup
        db.commit()

        # Generate Officers (Assigned to offices and supervisors)
        officers_list = []
        for name, office in offices.items():
            supervisor = supervisors[name]
            # Create 3-5 officers per office
            for _ in range(random.randint(3, 5)):
                user = models.User(
                    username=fake.user_name(),
                    email=fake.email(),
                    password_hash='hash123',
                    role_id=role_map['Officer']
                )
                db.add(user)
                db.flush()

                officer = models.Officer(
                    user_id=user.user_id,
                    location_id=office.location_id,
                    supervisor_id=supervisor.officer_id,
                    badge_number=f"PO-{random.randint(1000, 9999)}",
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    phone_number=fake.phone_number()
                )
                db.add(officer)
                officers_list.append(officer)
        
        # Add supervisors to officers_list so they also get cases
        for sup in supervisors.values():
            officers_list.append(sup)
            
        db.commit()

        # Generate Facilities
        facilities = []
        facility_data = [
            {"name": "Hope House", "services": "Substance Abuse Treatment, Job Placement"},
            {"name": "New Beginnings", "services": "Reentry Support, Counseling"},
            {"name": "Freedom Center", "services": "Housing Assistance, Life Skills"},
            {"name": "Recovery Works", "services": "Inpatient Treatment, Group Therapy"}
        ]
        
        for fac in facility_data:
            facility = models.Facility(
                name=fac["name"],
                address=f"{fake.building_number()} {fake.street_name()}, {fake.city()}",
                phone=fake.phone_number(),
                services_offered=fac["services"]
            )
            db.add(facility)
            facilities.append(facility)
        db.commit()

        # Generate Offenders & Episodes
        officer_cycle = itertools.cycle(officers_list)
        
        for i in range(200):
            first_name = fake.first_name()
            last_name = fake.last_name()
            offender = models.Offender(
                badge_id=f"DOC-{random.randint(100000, 999999)}",
                first_name=first_name,
                last_name=last_name,
                dob=fake.date_of_birth(minimum_age=18, maximum_age=70),
                image_url=f"https://ui-avatars.com/api/?name={first_name}+{last_name}&background=random" # Reliable placeholder
            )
            db.add(offender)
            db.flush()

            # Ensure every officer gets at least 2 cases, then random
            if i < len(officers_list) * 2:
                assigned_officer = next(officer_cycle)
            else:
                assigned_officer = random.choice(officers_list)

            episode = models.SupervisionEpisode(
                offender_id=offender.offender_id,
                assigned_officer_id=assigned_officer.officer_id,
                start_date=fake.date_between(start_date='-2y', end_date='today'),
                status=random.choice(['Active', 'Active', 'Active', 'Closed']),
                risk_level_at_start=random.choice(['Low', 'Medium', 'High'])
            )
            db.add(episode)
            db.flush()

            # Generate Residence (Facility or Private)
            is_in_facility = random.random() < 0.15 # 15% chance of being in a facility
            
            if is_in_facility:
                facility = random.choice(facilities)
                residence = models.Residence(
                    episode_id=episode.episode_id,
                    facility_id=facility.facility_id,
                    address_line_1=facility.address,
                    city=facility.address.split(', ')[-1], # Simple parsing
                    state=fake.state_abbr(),
                    zip_code=fake.zipcode(),
                    is_current=True
                )
                db.add(residence)
            else:
                residence = models.Residence(
                    episode_id=episode.episode_id,
                    address_line_1=fake.street_address(),
                    city=fake.city(),
                    state=fake.state_abbr(),
                    zip_code=fake.zipcode(),
                    is_current=True
                )
                db.add(residence)
                db.flush()
                
                # Add Residence Contacts for private residence
                if random.random() < 0.6: # 60% chance of having contacts
                    for _ in range(random.randint(1, 3)):
                        contact = models.ResidenceContact(
                            residence_id=residence.residence_id,
                            name=fake.name(),
                            relation=random.choice(['Spouse', 'Parent', 'Sibling', 'Roommate', 'Child']),
                            phone=fake.phone_number(),
                            comments=fake.sentence()
                        )
                        db.add(contact)

            # Generate Case Notes
            for _ in range(random.randint(2, 5)):
                note = models.CaseNote(
                    offender_id=offender.offender_id,
                    author_id=random.choice(officers_list).officer_id,
                    date=fake.date_time_between(start_date='-1y', end_date='now'),
                    content=fake.paragraph(nb_sentences=3)
                )
                db.add(note)

            # Generate Urinalysis
            for _ in range(random.randint(1, 3)):
                is_positive = random.random() < 0.2
                result = "Positive (THC)" if is_positive else "Negative"
                ua = models.Urinalysis(
                    offender_id=offender.offender_id,
                    date=fake.date_between(start_date='-6m', end_date='today'),
                    test_type=random.choice(['Random', 'Scheduled', 'Suspicion']),
                    result=result,
                    lab_name="LabCorp",
                    collected_by_id=random.choice(officers_list).officer_id,
                    notes="Offender admitted use" if is_positive else None
                )
                db.add(ua)

            # Generate Risk Assessment
            risk_score = random.randint(0, 30)
            risk_level = "Low" if risk_score < 10 else "Medium" if risk_score < 20 else "High"
            assessment = models.RiskAssessment(
                offender_id=offender.offender_id,
                date=fake.date_between(start_date='-1y', end_date='today'),
                total_score=risk_score,
                risk_level=risk_level,
                details={
                    "Criminal History": "High" if risk_score > 20 else "Low",
                    "Education": "Medium",
                    "Family": "Low",
                    "Substance Abuse": "High" if risk_score > 15 else "Low"
                }
            )
            db.add(assessment)

            # Generate Appointment
            appt = models.Appointment(
                offender_id=offender.offender_id,
                officer_id=episode.assigned_officer_id,
                date_time=fake.future_datetime(end_date='+30d'),
                location="Field Office",
                type=random.choice(['Routine Check-in', 'UA Testing', 'Case Plan Review']),
                status="Scheduled",
                notes="Bring pay stub"
            )
            db.add(appt)

        
        db.commit()
        print("Successfully generated seed data with Offices and Supervisors.")
        
    except Exception as e:
        print(f"Error generating data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure tables exist (Drop first to reset schema)
    print("Dropping existing tables...")
    models.Base.metadata.drop_all(bind=database.engine)
    print("Creating tables...")
    models.Base.metadata.create_all(bind=database.engine)
    generate_seed_data()
