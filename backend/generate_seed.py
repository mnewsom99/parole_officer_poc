from faker import Faker
import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import itertools
from . import models, database, auth

fake = Faker()

# Metro Phoenix Zip Codes by Region (Approximate)
PHOENIX_REGIONS = {
    "North": [
        "85020", "85021", "85022", "85023", "85024", "85027", "85028", "85029", "85032", 
        "85050", "85053", "85054", "85083", "85085", "85086", "85087", "85254", "85255", 
        "85331", "85377"
    ],
    "South": [
        "85004", "85007", "85034", "85040", "85041", "85042", "85044", "85045", "85048", 
        "85283", "85284", "85003", "85224", "85225", "85226", "85248", "85249", "85286"
    ],
    "East": [
        "85006", "85008", "85016", "85018", "85250", "85251", "85253", "85256", "85257", 
        "85281", "85282", "85201", "85202", "85203", "85204", "85205", "85206", "85207", 
        "85208", "85209", "85210", "85212", "85213", "85215"
    ],
    "West": [
        "85009", "85031", "85033", "85035", "85037", "85043", "85301", "85302", "85303", 
        "85304", "85305", "85306", "85307", "85308", "85309", "85310", "85323", "85335", 
        "85338", "85339", "85340", "85345", "85351", "85353", "85354", "85355", "85361", 
        "85363", "85381", "85382", "85383"
    ]
}

def generate_seed_data():
    db = database.SessionLocal()
    
    try:
        print("Starting generation...")

        # 1. Generate Roles
        roles = ['Officer', 'Supervisor', 'Manager', 'Admin']
        role_map = {}
        for i, role_name in enumerate(roles, 1):
            role = models.Role(role_id=i, role_name=role_name, description=f"Role for {role_name}")
            db.add(role)
            role_map[role_name] = i
        db.commit()

        # 2. System Settings
        import json
        note_types_config = [
            {"name": "General", "color": "bg-slate-100 text-slate-700"},
            {"name": "Home Visit", "color": "bg-blue-100 text-blue-700"},
            {"name": "Field Visit", "color": "bg-green-100 text-green-700"},
            {"name": "Office Visit", "color": "bg-purple-100 text-purple-700"},
            {"name": "Violation", "color": "bg-red-100 text-red-700"},
            {"name": "Phone Call", "color": "bg-yellow-100 text-yellow-700"}
        ]
        
        offender_flags_config = [
            {"name": "SMI", "color": "bg-purple-100 text-purple-700"},
            {"name": "Veteran", "color": "bg-blue-100 text-blue-700"},
            {"name": "Sex Offender", "color": "bg-orange-100 text-orange-800"},
            {"name": "GPS", "color": "bg-slate-100 text-slate-700"},
            {"name": "Gang Member", "color": "bg-red-100 text-red-700"}
        ]
        
        db.add(models.SystemSettings(key='note_types', value=json.dumps(note_types_config)))
        db.add(models.SystemSettings(key='offender_flags', value=json.dumps(offender_flags_config)))
        db.commit()

        # 3. Create Locations (4 Regional + 1 Specialty)
        locations = {}
        regional_offices = ["North", "South", "East", "West"]
        
        for name in regional_offices:
            loc = models.Location(
                name=f"{name} Field Office",
                address=f"{fake.building_number()} {name} Ave, Phoenix, AZ",
                type='Field Office'
            )
            db.add(loc)
            locations[name] = loc
        
        specialty_loc = models.Location(
            name="Specialty Services Division",
            address="100 W Washington St, Phoenix, AZ",
            type='HQ'
        )
        db.add(specialty_loc)
        locations["Specialty"] = specialty_loc
        
        db.commit()

        # 4. Create Supervisors (1 per location)
        supervisors = {}
        for name, loc in locations.items():
            user = models.User(
                username=f"sup_{name.lower()}",
                email=f"sup.{name.lower()}@doc.az.gov",
                password_hash=auth.get_password_hash('admin123'),
                role_id=role_map['Supervisor']
            )
            db.add(user)
            db.flush()
            
            sup = models.Officer(
                user_id=user.user_id,
                location_id=loc.location_id,
                badge_number=f"SUP-{name[0]}-{random.randint(10,99)}",
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone_number=fake.phone_number()
            )
            db.add(sup)
            supervisors[name] = sup
        db.commit()

        # 5. Create Officers & Territories
        all_officers = [] 
        region_officers_map = {r: [] for r in regional_offices} 
        zip_owner_map = {} 

        # -- Field Officers --
        officer_counter = 1
        for region in regional_offices:
            loc = locations[region]
            sup = supervisors[region]
            zips = PHOENIX_REGIONS[region]
            
            # Create 20 officers per region
            num_officers = 20
            
            current_officers = []
            
            for i in range(num_officers):
                username = f"po.{region.lower()}.{i+1}"
                user = models.User(
                    username=username,
                    email=f"{username}@doc.az.gov",
                    password_hash=auth.get_password_hash('password123'),
                    role_id=role_map['Officer']
                )
                db.add(user)
                db.flush()
                
                off = models.Officer(
                    user_id=user.user_id,
                    location_id=loc.location_id,
                    supervisor_id=sup.officer_id, # Asssigned to Region Supervisor
                    badge_number=f"PO-{1000 + officer_counter}",
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    phone_number=fake.phone_number()
                )
                db.add(off)
                current_officers.append(off)
                all_officers.append(off)
                region_officers_map[region].append(off)
                officer_counter += 1
            
            db.flush()

            # Assign Territories (Zip Codes)
            for z in zips:
                terr = models.Territory(
                    zip_code=z,
                    assigned_location_id=loc.location_id,
                    region_name=region
                )
                db.add(terr)
            db.flush()

            # Assign Zips to Officers (Round Robin)
            officer_cycle = itertools.cycle(current_officers)
            for z in zips:
                assigned_po = next(officer_cycle)
                to = models.TerritoryOfficer(
                    zip_code=z,
                    officer_id=assigned_po.officer_id,
                    is_primary=True
                )
                db.add(to)
                zip_owner_map[z] = assigned_po
        
        # -- Specialty Officers (SMI & Admin) --
        specialty_types = [
            ("SMI", 2),
            ("HighPro", 1) 
        ]
        
        specialty_officers = {"SMI": [], "HighPro": []}
        
        spec_sup = supervisors["Specialty"]
        spec_loc = locations["Specialty"]

        for spec_type, count in specialty_types:
            for i in range(count):
                username = f"spec.{spec_type.lower()}.{i+1}"
                user = models.User(
                    username=username,
                    email=f"{username}@doc.az.gov",
                    password_hash=auth.get_password_hash('password123'),
                    role_id=role_map['Officer']
                )
                db.add(user)
                db.flush()
                
                off = models.Officer(
                    user_id=user.user_id,
                    location_id=spec_loc.location_id,
                    supervisor_id=spec_sup.officer_id, # Assigned to Specialty Supervisor
                    badge_number=f"SP-{spec_type}-{100+i}",
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    phone_number=fake.phone_number()
                )
                db.add(off)
                specialty_officers[spec_type].append(off)
                all_officers.append(off)
        
        db.commit()
        print(f"Created {len(all_officers)} officers.")

        # 6. Default Admin User
        admin_officer = specialty_officers["HighPro"][0]
        
        admin_user = models.User(
            username="admin",
            email="admin@system.local",
            password_hash=auth.get_password_hash("admin123"),
            role_id=role_map['Admin']
        )
        db.add(admin_user)
        db.flush()
        
        # Link Admin user to HighPro officer
        temp_user_id = admin_officer.user_id
        admin_officer.user_id = admin_user.user_id
        admin_officer.first_name = "System"
        admin_officer.last_name = "Admin"
        
        db.add(admin_officer)
        db.flush()
        
        if temp_user_id:
            db.query(models.User).filter(models.User.user_id == temp_user_id).delete()
        db.commit()

        # 7. Generate Facilities (as SpecialAssignments)
        facilities = []
        facility_data = [
            {"name": "Hope House", "services": "Substance Abuse Treatment"},
            {"name": "New Beginnings", "services": "Reentry Support"},
            {"name": "Freedom Center", "services": "Housing Assistance"},
            {"name": "Recovery Works", "services": "Inpatient Treatment"}
        ]
        
        for fac in facility_data:
            sa = models.SpecialAssignment(
                type="Facility",
                name=fac["name"],
                address=f"{fake.building_number()} {fake.street_name()}, Phoenix, AZ",
                zip_code=fake.zipcode()
            )
            db.add(sa)
            facilities.append(sa)
        db.commit()

        # 7b. Generate Risk Types & Questions
        oras = models.RiskAssessmentType(
            type_id=1, name="ORAS", description="Ohio Risk Assessment System",
            scoring_matrix=[{"label": "Low", "min": 0, "max": 14}, {"label": "Medium", "min": 15, "max": 23}, {"label": "High", "min": 24, "max": 99}]
        )
        db.add(oras)
        
        static99 = models.RiskAssessmentType(
            type_id=2, name="Static-99R", description="Sex Offender Risk Assessment",
            scoring_matrix=[{"label": "Low", "min": 0, "max": 1}, {"label": "Moderate-Low", "min": 2, "max": 3}, {"label": "Moderate-High", "min": 4, "max": 5}, {"label": "High", "min": 6, "max": 99}]
        )
        db.add(static99)
        db.flush()

        # Mock Questions (Universal)
        questions_data = [
            ("employment_status", "Are you currently employed?", "boolean", "ORAS", [{"label": "No", "value": 1}, {"label": "Yes", "value": 0}]),
            ("prior_felony_convictions", "Number of prior felony convictions?", "integer", "ORAS", None),
            ("drug_use_problems", "History of drug use problems?", "boolean", "ORAS", [{"label": "Yes", "value": 1}, {"label": "No", "value": 0}]),
            ("age_at_first_arrest", "Age at first arrest?", "integer", "ORAS", None)
        ]
        
        for q_tag, q_text, q_type, q_assess, q_opts in questions_data:
            db.add( models.RiskAssessmentQuestion(
                universal_tag=q_tag,
                question_text=q_text,
                input_type=q_type,
                source_type='dynamic',
                assessments_list=q_assess,
                options=q_opts if q_opts else None
            ))
        db.commit()

        # 8. Generate Offenders (600 count)
        print("Generating 600 offenders...")
        
        target_smi = 80
        target_admin = 40
        target_standard = 600 - target_smi - target_admin
        
        case_types = (['SMI'] * target_smi) + (['Admin'] * target_admin) + (['Standard'] * target_standard)
        random.shuffle(case_types)
        
        smi_officer_cycle = itertools.cycle(specialty_officers["SMI"])
        
        for i, c_type in enumerate(case_types):
            if i % 100 == 0:
                print(f"  Processed {i} offenders...")
            
            first = fake.first_name()
            last = fake.last_name()
            
            assigned_officer = None
            assigned_zip = None
            region_name = None
            
            if c_type == 'SMI':
                assigned_officer = next(smi_officer_cycle)
                region_name = random.choice(regional_offices)
                assigned_zip = random.choice(PHOENIX_REGIONS[region_name])
                
            elif c_type == 'Admin':
                assigned_officer = admin_officer
                region_name = random.choice(regional_offices)
                assigned_zip = random.choice(PHOENIX_REGIONS[region_name])
                
            else: # Standard
                region_name = random.choice(regional_offices)
                assigned_zip = random.choice(PHOENIX_REGIONS[region_name])
                assigned_officer = zip_owner_map.get(assigned_zip)
                if not assigned_officer:
                    assigned_officer = random.choice(region_officers_map[region_name])

            # Offender
            offender = models.Offender(
                badge_id=f"DOC-{random.randint(100000, 999999)}",
                first_name=first,
                last_name=last,
                dob=fake.date_of_birth(minimum_age=18, maximum_age=70),
                image_url=f"https://ui-avatars.com/api/?name={first}+{last}&background=random",
                gender=random.choice(['Male', 'Female']),
                # REMOVED: is_sex_offender, is_gang_member
                
                release_date=fake.date_between(start_date='-2y', end_date='today'),
                
                # New Fields
                csed_date=fake.date_between(start_date='today', end_date='+5y'),
                
                # Dynamic Flags Generation
                special_flags = [],
                housing_status=random.choice(['Stable', 'Transient', 'Home Arrest', 'Homeless']) if random.random() < 0.3 else 'Stable',
                icots_number=f"ICOTS-{random.randint(10000, 99999)}" if random.random() < 0.10 else None,
                
                general_comments=f"Generated as {c_type} case.",
                employment_status=random.choice(['Employed', 'Unemployed', 'Unemployable'])
            )
            
            # Populate special_flags randomly
            flags = []
            if random.random() < 0.20: flags.append("Sex Offender")
            if random.random() < 0.15: flags.append("Gang Member")
            if c_type == 'SMI' or random.random() < 0.15: flags.append("SMI")
            if random.random() < 0.15: flags.append("Veteran")
            if random.random() < 0.15: flags.append("GPS")
            
            offender.special_flags = flags
            
            db.add(offender)
            db.flush()
            
            # Episode
            ep_status = 'Active' 
            risk = 'High' if c_type == 'SMI' else random.choice(['Low', 'Medium', 'High'])
            
            episode = models.SupervisionEpisode(
                offender_id=offender.offender_id,
                assigned_officer_id=assigned_officer.officer_id,
                start_date=offender.release_date,
                status=ep_status,
                risk_level_at_start=risk
            )
            db.add(episode)
            db.flush()
            
            # Residence
            is_in_facility = (random.random() < 0.05) and (c_type != 'SMI') # SMI usually in placement but keeping simple
            
            res_addr = fake.street_address()
            res_sa_id = None
            
            if is_in_facility:
                fac = random.choice(facilities)
                res_addr = fac.address.split(',')[0]
                res_sa_id = fac.assignment_id

            res = models.Residence(
                episode_id=episode.episode_id,
                address_line_1=res_addr,
                city="Phoenix",
                state="AZ",
                zip_code=assigned_zip,
                is_current=True,
                special_assignment_id=res_sa_id
            )
            db.add(res)
            
            # Notes
            for _ in range(random.randint(0, 3)):
                db.add(models.CaseNote(
                    offender_id=offender.offender_id,
                    author_id=assigned_officer.officer_id,
                    content=fake.sentence(),
                    type='General',
                    date=fake.date_between(start_date='-6m', end_date='today')
                ))

            # Tasks
            if ep_status == 'Active':
                 # Increase task count to ensure populated dashboards
                 for _ in range(random.randint(2, 5)):
                     task_type = random.choice([
                         "Review Monthly Report", 
                         "Verify Employment", 
                         "Home Visit Follow-up",
                         "Field Visit",
                         "Complete Assessment",
                         "Update Risk Assessment"
                     ])
                     
                     status = 'Pending'
                     # Randomize status a bit more
                     rand = random.random()
                     if rand < 0.3: status = 'Completed'
                     elif rand < 0.5: status = 'In Progress'
                     
                     db.add(models.Task(
                         episode_id=episode.episode_id,
                         created_by=assigned_officer.officer_id,
                         assigned_officer_id=assigned_officer.officer_id, # Assign to officer
                         title=task_type,
                         description=fake.sentence(),
                         due_date=fake.date_between(start_date='-1w', end_date='+2w'),
                         status=status
                     ))

            # Appointments (NEW)
            if ep_status == 'Active':
                 for _ in range(random.randint(1, 4)):
                     appt_date = fake.date_between(start_date='-1M', end_date='+2M')
                     # Combine date with random time (9am - 4pm)
                     appt_time = datetime(
                         appt_date.year, appt_date.month, appt_date.day,
                         random.randint(9, 16), random.choice([0, 15, 30, 45])
                     )
                     
                     db.add(models.Appointment(
                         offender_id=offender.offender_id,
                         officer_id=assigned_officer.officer_id,
                         date_time=appt_time,
                         type=random.choice(['Office Visit', 'Home Visit', 'Drug Test', 'Court Appearance']),
                         location=assigned_officer.location.name if assigned_officer.location else "Field",
                         status='Scheduled' if appt_time > datetime.now() else 'Completed',
                         notes=fake.sentence()
                     ))

            # Urinalysis (NEW)
            for _ in range(random.randint(0, 5)):
                ua_date = fake.date_between(start_date='-6m', end_date='today')
                is_positive = random.random() < 0.15
                
                db.add(models.Urinalysis(
                    offender_id=offender.offender_id,
                    date=ua_date,
                    test_type=random.choice(['Random', 'Scheduled', 'Suspicion']),
                    result='Positive (THC)' if is_positive else 'Negative',
                    lab_name="LabCorp" if random.random() < 0.5 else "Sonora Quest",
                    collected_by_id=assigned_officer.officer_id,
                    notes="Dilute sample" if random.random() < 0.05 else None
                ))

            # Usage Fees (NEW)
            balance = random.uniform(0, 500) if random.random() < 0.3 else 0.0
            db.add(models.FeeBalance(
                offender_id=offender.offender_id,
                balance=round(balance, 2)
            ))
            # Default Monthly Charge
            db.add(models.FeeTransaction(
                offender_id=offender.offender_id,
                transaction_date=datetime.now().date().replace(day=1),
                type='Charge',
                amount=65.00,
                description="Monthly Supervision Fee"
            ))

            # Risk Assessment History (NEW)
            num_assessments = random.randint(1, 2)
            for _ in range(num_assessments):
                a_type = 'SMI' if c_type == 'SMI' else 'ORAS' # Simplified
                if a_type == 'ORAS':
                    score = random.randint(0, 35)
                    level = 'Low'
                    if score > 14: level = 'Medium'
                    if score > 23: level = 'High'
                    
                    db.add(models.RiskAssessment(
                        offender_id=offender.offender_id,
                        date=fake.date_between(start_date='-1y', end_date='today'),
                        assessment_type='ORAS',
                        status='Completed',
                        total_score=score,
                        risk_level=level,
                        final_risk_level=level,
                        details={"employment": 0, "criminal_history": score}
                    ))

        db.commit()
        print("Done! Database re-seeded.")

    except Exception as e:
        print(f"Error seeding data: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Dropping tables...")
    models.Base.metadata.drop_all(bind=database.engine)
    print("Creating tables...")
    models.Base.metadata.create_all(bind=database.engine)
    generate_seed_data()
