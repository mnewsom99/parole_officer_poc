from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from uuid import UUID
import random
from datetime import datetime

from . import models, database, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Parole Officer Dashboard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5176", "http://localhost:3000"], # Allow Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Parole Officer Dashboard API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/locations", response_model=List[schemas.Location])
def get_locations(db: Session = Depends(get_db)):
    locations = db.query(models.Location).all()
    return locations

@app.get("/officers", response_model=List[schemas.Officer])
def get_officers(location_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    query = db.query(models.Officer).options(joinedload(models.Officer.location))
    if location_id:
        query = query.filter(models.Officer.location_id == location_id)
    officers = query.all()
    return officers

@app.get("/offenders") # Returning custom dict to match frontend for now
def get_offenders(officer_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    query = db.query(models.SupervisionEpisode).options(
        joinedload(models.SupervisionEpisode.offender),
        joinedload(models.SupervisionEpisode.residences).options(
            joinedload(models.Residence.facility),
            joinedload(models.Residence.contacts)
        )
    )
    
    if officer_id:
        query = query.filter(models.SupervisionEpisode.assigned_officer_id == officer_id)
        
    episodes = query.all()
    
    # Transform to match frontend expectation
    results = []
    for ep in episodes:
        offender = ep.offender
        if not offender:
            continue
            
        # Get current residence
        current_residence = next((r for r in ep.residences if r.is_current), None)
        
        address_str = "No Address"
        housing_type = "Unknown"
        facility_info = None
        contacts = []

        if current_residence:
            if current_residence.facility:
                housing_type = "Facility"
                address_str = f"{current_residence.facility.name} - {current_residence.facility.address}"
                facility_info = {
                    "name": current_residence.facility.name,
                    "address": current_residence.facility.address,
                    "phone": current_residence.facility.phone,
                    "services": current_residence.facility.services_offered
                }
            else:
                housing_type = "Private"
                address_str = f"{current_residence.address_line_1}, {current_residence.city}, {current_residence.state} {current_residence.zip_code}"
                contacts = [
                    {
                        "name": c.name,
                        "relation": c.relation,
                        "phone": c.phone,
                        "comments": c.comments
                    } for c in current_residence.contacts
                ]
        
        results.append({
            "id": str(offender.offender_id),
            "name": f"{offender.last_name}, {offender.first_name}",
            "badgeId": offender.badge_id,
            "risk": ep.risk_level_at_start, # Using start risk as current
            "status": ep.status,
            "nextCheck": "2025-12-10T10:00:00", # Mock next check
            "compliance": random.randint(60, 100), # Mock compliance
            "image": offender.image_url or f"https://ui-avatars.com/api/?name={offender.first_name}+{offender.last_name}&background=random",
            "address": address_str,
            "city": current_residence.city if current_residence else "",
            "zip": current_residence.zip_code if current_residence else "",
            "phone": "555-0199", # Mock phone
            "housingType": housing_type,
            "facility": facility_info,
            "residenceContacts": contacts
        })
        
    return results

@app.post("/offenders", response_model=schemas.Offender)
def create_offender(offender: schemas.OffenderCreate, db: Session = Depends(get_db)):
    # 1. Create Offender
    new_offender = models.Offender(
        badge_id=offender.badge_id,
        first_name=offender.first_name,
        last_name=offender.last_name,
        dob=offender.dob,
        image_url=offender.image_url
    )
    db.add(new_offender)
    db.flush() # Flush to get offender_id
    
    # 2. Create Supervision Episode
    new_episode = models.SupervisionEpisode(
        offender_id=new_offender.offender_id,
        assigned_officer_id=offender.assigned_officer_id,
        start_date=offender.start_date,
        end_date=offender.end_date,
        status="Active",
        risk_level_at_start=offender.risk_level
    )
    db.add(new_episode)
    db.flush() # Flush to get episode_id
    
    # 3. Create Residence
    new_residence = models.Residence(
        episode_id=new_episode.episode_id,
        address_line_1=offender.address_line_1,
        city=offender.city,
        state=offender.state,
        zip_code=offender.zip_code,
        is_current=True
    )
    db.add(new_residence)
    
    db.commit()
    db.refresh(new_offender)
    db.commit()
    db.refresh(new_offender)
    return new_offender

@app.get("/offenders/{offender_id}/urinalysis", response_model=List[schemas.Urinalysis])
def get_urinalysis(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Urinalysis).filter(models.Urinalysis.offender_id == offender_id).options(joinedload(models.Urinalysis.collected_by)).order_by(models.Urinalysis.date.desc()).all()

@app.get("/offenders/{offender_id}/notes", response_model=List[schemas.CaseNote])
def get_case_notes(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.CaseNote).filter(models.CaseNote.offender_id == offender_id).options(joinedload(models.CaseNote.author)).order_by(models.CaseNote.date.desc()).all()

@app.get("/offenders/{offender_id}/risk", response_model=List[schemas.RiskAssessment])
def get_risk_assessments(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.RiskAssessment).filter(models.RiskAssessment.offender_id == offender_id).order_by(models.RiskAssessment.date.desc()).all()

@app.get("/offenders/{offender_id}/appointments", response_model=List[schemas.Appointment])
def get_appointments(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Appointment).filter(models.Appointment.offender_id == offender_id).options(joinedload(models.Appointment.officer)).order_by(models.Appointment.date_time.asc()).all()

@app.post("/offenders/{offender_id}/notes", response_model=schemas.CaseNote)
def create_case_note(offender_id: UUID, note: schemas.CaseNoteBase, db: Session = Depends(get_db)):
    # Mock author for now (first officer found)
    author = db.query(models.Officer).first()
    new_note = models.CaseNote(
        offender_id=offender_id,
        author_id=author.officer_id,
        content=note.content,
        date=datetime.utcnow()
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@app.post("/offenders/{offender_id}/appointments", response_model=schemas.Appointment)
def create_appointment(offender_id: UUID, appt: schemas.AppointmentBase, db: Session = Depends(get_db)):
    # Mock officer for now
    officer = db.query(models.Officer).first()
    new_appt = models.Appointment(
        offender_id=offender_id,
        officer_id=officer.officer_id,
        date_time=appt.date_time,
        location=appt.location,
        type=appt.type,
        status="Scheduled",
        notes=appt.notes
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    return new_appt
