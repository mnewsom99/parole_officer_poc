from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import random

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["Offenders"])

@router.get("/offenders")
def get_offenders(
    officer_id: Optional[UUID] = None, 
    location_id: Optional[UUID] = None, 
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(models.SupervisionEpisode).options(
        joinedload(models.SupervisionEpisode.offender),
        joinedload(models.SupervisionEpisode.residences).options(
            joinedload(models.Residence.special_assignment),
            joinedload(models.Residence.contacts)
        )
    )
    
    if officer_id:
        query = query.filter(models.SupervisionEpisode.assigned_officer_id == officer_id)
    elif location_id:
        query = query.join(models.Officer).filter(models.Officer.location_id == location_id)
        
    # Calculate total for pagination metadata
    total = query.count()
    
    # Apply Pagination
    offset = (page - 1) * limit
    episodes = query.offset(offset).limit(limit).all()
    
    # Transform to match frontend expectation
    results = []
    for ep in episodes:
        offender = ep.offender
        if not offender:
            continue
            
        # Get current residence
        # Optimization: Ideally this should be filtered in the query or via a separate relationship
        current_residence = next((r for r in ep.residences if r.is_current), None)
        
        address_str = "No Address"
        housing_type = "Unknown"
        facility_info = None
        contacts = []

        if current_residence:
            if current_residence.special_assignment and current_residence.special_assignment.type == 'Facility':
                housing_type = "Facility"
                sa = current_residence.special_assignment
                address_str = f"{sa.name} - {sa.address}"
                facility_info = {
                    "name": sa.name,
                    "address": sa.address,
                    "phone": "N/A", 
                    "services": "Standard" 
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
            "risk": ep.risk_level_at_start, 
            "status": ep.status,
            "nextCheck": "2025-12-10T10:00:00", 
            "compliance": random.randint(60, 100), 
            "image": offender.image_url or f"https://ui-avatars.com/api/?name={offender.first_name}+{offender.last_name}&background=random",
            "address": address_str,
            "city": current_residence.city if current_residence else "",
            "state": current_residence.state if current_residence else "",
            "zip": current_residence.zip_code if current_residence else "",
            "phone": "555-0199",
            "housingType": housing_type,
            "facility": facility_info,
            "residenceContacts": contacts,
            "gender": offender.gender,
            "isSexOffender": offender.is_sex_offender,
            "isGangMember": offender.is_gang_member,
            "gangAffiliation": offender.gang_affiliation,
            "releaseDate": offender.release_date,
            "reversionDate": offender.reversion_date,
            "releaseType": offender.release_type,
            "initialPlacement": offender.initial_placement,
            "generalComments": offender.general_comments
        })
        
    return {
        "data": results,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.post("/offenders", response_model=schemas.Offender)
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
    
    # 4. Assign Onboarding Tasks
    from .. import tasks
    tasks.assign_onboarding_tasks(new_episode.episode_id, db)
    
    return new_offender

@router.get("/offenders/{offender_id}")
def get_offender_details(offender_id: UUID, db: Session = Depends(get_db)):
    episode = db.query(models.SupervisionEpisode).options(
        joinedload(models.SupervisionEpisode.offender),
        joinedload(models.SupervisionEpisode.residences).options(
            joinedload(models.Residence.special_assignment),
            joinedload(models.Residence.contacts)
        )
    ).filter(models.SupervisionEpisode.offender_id == offender_id, models.SupervisionEpisode.status == "Active").first()

    if not episode:
        raise HTTPException(status_code=404, detail="Offender not found or not active")

    offender = episode.offender
    
    current_residence = next((r for r in episode.residences if r.is_current), None)
    
    address_str = "No Address"
    housing_type = "Unknown"
    facility_info = None
    contacts = []

    if current_residence:
        if current_residence.special_assignment:
            housing_type = "Facility"
            sa = current_residence.special_assignment
            address_str = f"{sa.name} - {sa.address}"
            facility_info = {
                "name": sa.name,
                "address": sa.address,
                "phone": "N/A",
                "services": "Standard"
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

    return {
        "id": str(offender.offender_id),
        "name": f"{offender.last_name}, {offender.first_name}",
        "badgeId": offender.badge_id,
        "risk": episode.risk_level_at_start,
        "status": episode.status,
        "nextCheck": "2025-12-10T10:00:00", # Mock
        "compliance": random.randint(60, 100), # Mock
        "image": offender.image_url or f"https://ui-avatars.com/api/?name={offender.first_name}+{offender.last_name}&background=random",
        "address": address_str,
        "city": current_residence.city if current_residence else "",
        "state": current_residence.state if current_residence else "",
        "zip": current_residence.zip_code if current_residence else "",
        "phone": "555-0199", # Mock
        "housingType": housing_type,
        "facility": facility_info,
        "residenceContacts": contacts,
        "gender": offender.gender,
        "isSexOffender": offender.is_sex_offender,
        "isGangMember": offender.is_gang_member,
        "gangAffiliation": offender.gang_affiliation,
        "releaseDate": offender.release_date,
        "reversionDate": offender.reversion_date,
        "releaseType": offender.release_type,
        "initialPlacement": offender.initial_placement,
        "generalComments": offender.general_comments
    }

# Sub-resources
@router.get("/offenders/{offender_id}/urinalysis", response_model=List[schemas.Urinalysis])
def get_urinalysis(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Urinalysis).filter(models.Urinalysis.offender_id == offender_id).options(joinedload(models.Urinalysis.collected_by)).order_by(models.Urinalysis.date.desc()).all()

@router.get("/offenders/{offender_id}/notes", response_model=List[schemas.CaseNote])
def get_case_notes(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.CaseNote).filter(models.CaseNote.offender_id == offender_id).options(joinedload(models.CaseNote.author)).order_by(models.CaseNote.is_pinned.desc(), models.CaseNote.date.desc()).all()

@router.post("/offenders/{offender_id}/notes", response_model=schemas.CaseNote)
def create_case_note(offender_id: UUID, note: schemas.CaseNoteBase, db: Session = Depends(get_db)):
    # Mock author for now (first officer found)
    author = db.query(models.Officer).first()
    new_note = models.CaseNote(
        offender_id=offender_id,
        author_id=author.officer_id,
        content=note.content,
        type=note.type,
        date=datetime.utcnow()
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@router.put("/notes/{note_id}/pin", response_model=schemas.CaseNote)
def toggle_pin_note(note_id: UUID, db: Session = Depends(get_db)):
    note = db.query(models.CaseNote).filter(models.CaseNote.note_id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note.is_pinned = not note.is_pinned
    db.commit()
    db.refresh(note)
    return note

@router.get("/offenders/{offender_id}/risk", response_model=List[schemas.RiskAssessment])
def get_risk_assessments(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.RiskAssessment).filter(models.RiskAssessment.offender_id == offender_id).order_by(models.RiskAssessment.date.desc()).all()

@router.get("/offenders/{offender_id}/appointments", response_model=List[schemas.Appointment])
def get_appointments(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Appointment).filter(models.Appointment.offender_id == offender_id).options(joinedload(models.Appointment.officer)).order_by(models.Appointment.date_time.asc()).all()

@router.post("/offenders/{offender_id}/appointments", response_model=schemas.Appointment)
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

@router.get("/offenders/{offender_id}/programs", response_model=List[schemas.Program])
def get_programs(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Program).filter(models.Program.offender_id == offender_id).order_by(models.Program.start_date.desc()).all()
