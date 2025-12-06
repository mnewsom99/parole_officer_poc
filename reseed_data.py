import random
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import SessionLocal, engine
from backend import models
import uuid

# Phoenix Metro Zip Codes (Selection of 50)
PHOENIX_ZIPS = [
    "85001", "85003", "85004", "85006", "85007", "85008", "85009", "85012", "85013", "85014",
    "85015", "85016", "85017", "85018", "85019", "85020", "85021", "85022", "85023", "85024",
    "85027", "85028", "85029", "85031", "85032", "85033", "85034", "85035", "85037", "85040",
    "85041", "85042", "85043", "85044", "85045", "85048", "85050", "85051", "85053", "85054",
    "85083", "85085", "85086", "85201", "85202", "85203", "85204", "85205", "85206", "85207"
]

def reseed():
    db = SessionLocal()
    try:
        print("Starting Data Reseed...")

        # 1. Fetch available Officers and Locations
        officers = db.query(models.Officer).all()
        locations = db.query(models.Location).all()
        
        if not officers:
            print("No officers found. Please start the app to seed default users first.")
            return

        print(f"Found {len(officers)} officers and {len(locations)} locations.")

        # 2. Clear existing Assignments (Territories and Special Assignments)
        db.query(models.Territory).delete()
        db.query(models.SpecialAssignment).delete()
        # Note: We won't delete offenders, just update them.
        db.commit()
        print("Cleared existing territories and special assignments.")

        # 3. Assign Territories (Zip Codes)
        # Distribute zips among officers and locations
        print("Assigning Territories...")
        for i, zip_code in enumerate(PHOENIX_ZIPS):
            # Randomly assign to an officer
            officer = random.choice(officers)
            # Randomly assign to a location (optional, but good for data)
            location = random.choice(locations) if locations else None
            
            territory = models.Territory(
                zip_code=zip_code,
                assigned_officer_id=officer.officer_id,
                assigned_location_id=location.location_id if location else None,
                region_name="Phoenix Metro"
            )
            db.add(territory)
        
        db.commit()

        # 4. Assign Zip Codes to Locations (Physical Address)
        # Give each location one of the zips as its "base"
        print("Updating Location Addresses...")
        for loc in locations:
            loc_zip = random.choice(PHOENIX_ZIPS)
            loc.zip_code = loc_zip
            loc.phone = f"(602) 555-{random.randint(1000, 9999)}"
            loc.fax = f"(602) 555-{random.randint(1000, 9999)}"
        db.commit()

        # 5. Create Special Assignments
        # "random 3 offcier one a SMI caseload, 2 admin, 1 newfreedom"
        # We'll pick 3 random officers to hold these assignments
        chosen_officers = random.sample(officers, min(len(officers), 3))
        
        assignments = []
        
        # SMI Caseload
        assignments.append(models.SpecialAssignment(
            assignment_id=uuid.uuid4(),
            type="Specialty",
            name="SMI Caseload",
            assigned_officer_id=chosen_officers[0].officer_id,
            priority=1
        ))

        # New Freedom (Facility)
        assignments.append(models.SpecialAssignment(
            assignment_id=uuid.uuid4(),
            type="Facility",
            name="New Freedom",
            address="2532 W Peoria Ave",
            zip_code="85029",
            assigned_officer_id=chosen_officers[1].officer_id if len(chosen_officers) > 1 else chosen_officers[0].officer_id,
            priority=2
        ))

        # 2 Admin Assignments
        assignments.append(models.SpecialAssignment(
            assignment_id=uuid.uuid4(),
            type="Admin",
            name="Audit Team A",
            assigned_officer_id=chosen_officers[2].officer_id if len(chosen_officers) > 2 else chosen_officers[0].officer_id,
            priority=3
        ))
        assignments.append(models.SpecialAssignment(
            assignment_id=uuid.uuid4(),
            type="Admin",
            name="Policy Review Board",
            assigned_officer_id=chosen_officers[2].officer_id if len(chosen_officers) > 2 else chosen_officers[0].officer_id, # Reuse 3rd officer or same
            priority=3
        ))

        for a in assignments:
            db.add(a)
        
        db.commit()
        print("Created Special Assignments.")

        # 6. Update Offenders to matching Zips
        # To make the map valid, offenders need to live in these zips.
        print("Updating Offender Residences...")
        episodes = db.query(models.SupervisionEpisode).all()
        for ep in episodes:
            # Find current residence
            residence = db.query(models.Residence).filter(
                models.Residence.episode_id == ep.episode_id,
                models.Residence.is_current == True
            ).first()
            
            if residence:
                new_zip = random.choice(PHOENIX_ZIPS)
                residence.zip_code = new_zip
                residence.city = "Phoenix"
                residence.state = "AZ"
                
                # Randomly assign a special assignment to some offenders
                if random.random() < 0.1: # 10% chance
                    # Assign to one of the created special assignments
                    sa = random.choice(assignments)
                    residence.special_assignment_id = sa.assignment_id
                    # If it's a facility, update address could be nice, but simple link is enough for logic
        
        db.commit()
        print("Reseed Complete!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reseed()
