from backend import models, database
from sqlalchemy import func

def check_distribution():
    db = database.SessionLocal()
    try:
        officers = db.query(models.Officer).all()
        print(f"Total Officers: {len(officers)}")
        
        empty_caseloads = 0
        for officer in officers:
            count = db.query(models.SupervisionEpisode).filter(
                models.SupervisionEpisode.assigned_officer_id == officer.officer_id,
                models.SupervisionEpisode.status == 'Active'
            ).count()
            
            print(f"Officer {officer.last_name} (SupID: {officer.supervisor_id}): {count} active cases")
            if count == 0:
                if officer.supervisor_id is None:
                    print(f"  -> Likely a Supervisor")
                empty_caseloads += 1
                
        print(f"\nOfficers with empty active caseloads: {empty_caseloads}")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_distribution()
