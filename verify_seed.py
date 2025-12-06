from backend import models, database
from sqlalchemy import func

def verify_data():
    db = database.SessionLocal()
    try:
        # 1. Counts
        loc_count = db.query(models.Location).count()
        off_count = db.query(models.Officer).count()
        offender_count = db.query(models.Offender).count()
        episode_count = db.query(models.SupervisionEpisode).count()
        sa_count = db.query(models.SpecialAssignment).count() # Facilities
        
        print("-" * 30)
        print(f"Locations: {loc_count} (Expected 5)")
        print(f"Officers: {off_count} (Expected ~85 including supervisors)")
        print(f"Offenders: {offender_count} (Expected 600)")
        print(f"Episodes: {episode_count} (Should match Offenders)")
        print(f"Facilities (SA): {sa_count} (Expected 4)")
        print("-" * 30)
        
        # 2. Distribution Check
        # Count offenders per officer location
        results = db.query(
            models.Location.name, 
            func.count(models.SupervisionEpisode.episode_id)
        ).join(models.Officer, models.SupervisionEpisode.assigned_officer_id == models.Officer.officer_id)\
         .join(models.Location, models.Officer.location_id == models.Location.location_id)\
         .group_by(models.Location.name).all()
        
        print("\nCaseload Distribution by Office:")
        total_cases = 0
        for name, count in results:
            print(f"  {name}: {count}")
            total_cases += count
            
        # 3. Specialty Check
        # SMI officers are in "Specialty Services Division"
        specialty_cases = db.query(models.SupervisionEpisode)\
            .join(models.Officer)\
            .join(models.Location)\
            .filter(models.Location.name == "Specialty Services Division")\
            .count()
            
        print(f"\nSpecialty/Admin Cases: {specialty_cases} (Expected ~120)")
        
        # 4. Zip Code Verification (Sample)
        # Check 5 standard cases
        print("\nZip Code Integrity Check (Sample 5 Standard Cases):")
        
        # Get standard officers (not specialty)
        standard_officers = db.query(models.Officer.officer_id).join(models.Location)\
            .filter(models.Location.name != "Specialty Services Division").subquery()
            
        samples = db.query(models.Offender, models.Residence, models.Officer, models.TerritoryOfficer)\
            .join(models.SupervisionEpisode, models.Offender.offender_id == models.SupervisionEpisode.offender_id)\
            .join(models.Residence, models.SupervisionEpisode.episode_id == models.Residence.episode_id)\
            .join(models.Officer, models.SupervisionEpisode.assigned_officer_id == models.Officer.officer_id)\
            .outerjoin(models.TerritoryOfficer, models.Officer.officer_id == models.TerritoryOfficer.officer_id)\
            .filter(models.Officer.officer_id.in_(standard_officers))\
            .filter(models.Residence.is_current == True)\
            .limit(5).all()
            
        for off, res, officer, terr_off in samples:
            match = (res.zip_code == terr_off.zip_code) if terr_off else False
            # Note: Officer might have multiple zips, terr_off join might return multiple rows.
            # Simplified check: Just print
            print(f"  Offender Zip: {res.zip_code} | Officer: {officer.last_name} | Assigned Zip: {terr_off.zip_code if terr_off else 'None'}")
            
    finally:
        db.close()

if __name__ == "__main__":
    verify_data()
