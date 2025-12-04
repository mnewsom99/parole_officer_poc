from sqlalchemy.orm import Session, joinedload
from backend import models, database

def check_data():
    db = database.SessionLocal()
    try:
        episodes = db.query(models.SupervisionEpisode).options(
            joinedload(models.SupervisionEpisode.offender),
            joinedload(models.SupervisionEpisode.residences)
        ).all()
        
        print(f"Found {len(episodes)} episodes.")
        
        count_with_ua = 0
        count_with_notes = 0
        count_with_risk = 0
        count_with_appt = 0
        count_with_address = 0
        count_with_image = 0
        count_in_facility = 0
        count_with_contacts = 0
        
        for ep in episodes:
            offender = ep.offender
            if not offender:
                continue
                
            # Check new entities
            ua_count = db.query(models.Urinalysis).filter(models.Urinalysis.offender_id == offender.offender_id).count()
            if ua_count > 0: count_with_ua += 1
            
            note_count = db.query(models.CaseNote).filter(models.CaseNote.offender_id == offender.offender_id).count()
            if note_count > 0: count_with_notes += 1
            
            risk_count = db.query(models.RiskAssessment).filter(models.RiskAssessment.offender_id == offender.offender_id).count()
            if risk_count > 0: count_with_risk += 1
            
            appt_count = db.query(models.Appointment).filter(models.Appointment.offender_id == offender.offender_id).count()
            if appt_count > 0: count_with_appt += 1

            current_residence = next((r for r in ep.residences if r.is_current), None)
            
            if current_residence:
                count_with_address += 1
                if current_residence.facility:
                    count_in_facility += 1
                elif current_residence.contacts:
                    count_with_contacts += 1
            
            if offender.image_url:
                count_with_image += 1
                
        print(f"Total Episodes: {len(episodes)}")
        print(f"With Address: {count_with_address}")
        print(f"With Image: {count_with_image}")
        print(f"In Facility: {count_in_facility}")
        print(f"With Contacts: {count_with_contacts}")
        print(f"With UA History: {count_with_ua}")
        print(f"With Case Notes: {count_with_notes}")
        print(f"With Risk Assessment: {count_with_risk}")
        print(f"With Appointments: {count_with_appt}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
