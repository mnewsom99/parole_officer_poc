from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload, selectinload
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
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    print(f"DEBUG: get_offenders called. Search='{search}'")
    query = db.query(models.SupervisionEpisode).options(
        joinedload(models.SupervisionEpisode.offender),
        selectinload(models.SupervisionEpisode.residences).options(
            joinedload(models.Residence.special_assignment),
            joinedload(models.Residence.contacts)
        )
    )
    
    if search:
        search_term = f"%{search.lower()}%"
        from sqlalchemy import or_, func
        query = query.join(models.SupervisionEpisode.offender).filter(
            or_(
                func.lower(models.Offender.first_name).like(search_term),
                func.lower(models.Offender.last_name).like(search_term),
                func.lower(models.Offender.badge_id).like(search_term)
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
        
            # Fetch next appointment
        next_appt = db.query(models.Appointment).filter(
            models.Appointment.offender_id == offender.offender_id,
            models.Appointment.date_time > datetime.utcnow(),
            models.Appointment.status == 'Scheduled'
        ).order_by(models.Appointment.date_time.asc()).first()


        # Dynamic Risk Lookup for List View
        latest_assessment = db.query(models.RiskAssessment).filter(
            models.RiskAssessment.offender_id == offender.offender_id,
            models.RiskAssessment.status == 'Completed'
        ).order_by(models.RiskAssessment.date.desc()).first()

        current_risk = "Unknown"
        if latest_assessment:
            current_risk = latest_assessment.final_risk_level or latest_assessment.risk_level
        else:
            current_risk = ep.current_risk_level or ep.risk_level_at_start

        results.append({
            "id": str(offender.offender_id),
            "name": f"{offender.last_name}, {offender.first_name}",
            "badgeId": offender.badge_id,
            "risk": current_risk, 
            "status": ep.status,
            "nextCheck": next_appt.date_time.isoformat() if next_appt else "Pending", 
            "compliance": random.randint(60, 100), 
            "image": offender.image_url or f"https://ui-avatars.com/api/?name={offender.first_name}+{offender.last_name}&background=random",
            "address": address_str,
            "city": current_residence.city if current_residence else "",
            "state": current_residence.state if current_residence else "",
            "zip": current_residence.zip_code if current_residence else "",
            "zip": current_residence.zip_code if current_residence else "",
            "phone": offender.phone or (contacts[0]["phone"] if contacts else f"(602) 555-{random.randint(1000, 9999)}"),
            "housingType": housing_type,
            "facility": facility_info,
            "residenceContacts": contacts,
            "gender": offender.gender,
            "isSexOffender": "Sex Offender" in (offender.special_flags or []),
            "isGangMember": "Gang Member" in (offender.special_flags or []),
            "gangAffiliation": offender.gang_affiliation,
            "releaseDate": offender.release_date,
            "reversionDate": offender.reversion_date,
            "releaseType": offender.release_type,
            "initialPlacement": offender.initial_placement,
            "initialPlacement": offender.initial_placement,
            "generalComments": offender.general_comments,
            "warrantStatus": offender.warrant_status,
            "warrantDate": offender.warrant_date,
            "releaseDate": offender.release_date,
            # Missing fields for dashboard stats
            "employment_status": offender.employment_status,
            "employmentHistory": [
                {
                    "employment_id": str(emp.employment_id),
                    "employer": emp.employer_name,
                    # "position": emp.position, # Field does not exist in model
                    "position": "Employee", # Placeholder until DB migration
                    "phone": emp.phone,
                    "supervisor": emp.supervisor,
                    "start_date": emp.start_date.isoformat() if emp.start_date else None,
                    "end_date": emp.end_date.isoformat() if emp.end_date else None,
                    "is_current": emp.is_current,
                    "address": f"{emp.address_line_1 or ''}, {emp.city or ''}, {emp.state or ''} {emp.zip_code or ''}".strip(", ")
                } for emp in offender.employments
            ],
            "csed_date": offender.csed_date,
            # Field Mode specific fields
            "first_name": offender.first_name,
            "last_name": offender.last_name,
            "offender_number": offender.badge_id,
            "risk_level": current_risk,
            "program": next((p.offering.program_name for p in db.query(models.ProgramEnrollment).options(joinedload(models.ProgramEnrollment.offering)).filter(models.ProgramEnrollment.offender_id == offender.offender_id, models.ProgramEnrollment.status == 'Active').limit(1)), "None Assigned"),
            # Remove duplicate phone override
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
    ).filter(models.SupervisionEpisode.offender_id == offender_id).order_by(models.SupervisionEpisode.start_date.desc()).first()

    if not episode:
        raise HTTPException(status_code=404, detail="Offender not found or supervision episode missing")

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


    # Dynamic Risk Lookup
    latest_assessment = db.query(models.RiskAssessment).filter(
        models.RiskAssessment.offender_id == offender.offender_id,
        models.RiskAssessment.status == 'Completed'
    ).order_by(models.RiskAssessment.date.desc()).first()

    current_risk = "Unknown"
    if latest_assessment:
        current_risk = latest_assessment.final_risk_level or latest_assessment.risk_level
    else:
        current_risk = episode.current_risk_level or episode.risk_level_at_start

    return {
        "id": str(offender.offender_id),
        "debug": "reload_check",
        "name": f"{offender.last_name}, {offender.first_name}",
        "badgeId": offender.badge_id,
        "risk": current_risk,
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
        "generalComments": offender.general_comments,
        # New Fields
        "csed_date": offender.csed_date,
        "housing_status": offender.housing_status,
        "csed_date": offender.csed_date,
        "housing_status": offender.housing_status,
        "icots_number": offender.icots_number,
        "employment_status": offender.employment_status,
        "unemployable_reason": offender.unemployable_reason,
        "employments": [
            {
                "employment_id": str(emp.employment_id),
                "employer_name": emp.employer_name,
                "address_line_1": emp.address_line_1,
                "city": emp.city,
                "state": emp.state,
                "zip_code": emp.zip_code,
                "phone": emp.phone,
                "supervisor": emp.supervisor,
                "pay_rate": emp.pay_rate,
                "is_current": emp.is_current,
                "start_date": emp.start_date,
                "end_date": emp.end_date
            } for emp in sorted(offender.employments, key=lambda x: x.is_current, reverse=True)
        ],
        "residenceHistory": [
            {
                "residence_id": str(r.residence_id),
                "address": r.address_line_1,
                "city": r.city,
                "state": r.state,
                "zip": r.zip_code,
                "startDate": r.start_date,
                "endDate": r.end_date,
                "housingType": r.housing_type,
                "isCurrent": r.is_current
            } for r in sorted(episode.residences, key=lambda x: x.start_date if x.start_date else datetime.min.date(), reverse=True)
        ],
        
        # Dynamic Flags
        "special_flags": offender.special_flags or [],
        
        # Legacy mappings for backward compatibility
        "isSexOffender": "Sex Offender" in (offender.special_flags or []),
        "isGangMember": "Gang Member" in (offender.special_flags or []),
        "is_smi": "SMI" in (offender.special_flags or []),
        "is_veteran": "Veteran" in (offender.special_flags or []),
        "has_gps": "GPS" in (offender.special_flags or []),
        "is_sex_offender": "Sex Offender" in (offender.special_flags or [])
    }

# Sub-resources
@router.post("/offenders/{offender_id}/employment", response_model=schemas.Employment)
def add_employment(offender_id: UUID, employment: schemas.EmploymentCreate, db: Session = Depends(get_db)):
    # If the new employment is current, close out any existing current employments
    if employment.is_current:
        active_employments = db.query(models.Employment).filter(
            models.Employment.offender_id == offender_id,
            models.Employment.is_current == True
        ).all()
        
        for emp in active_employments:
            emp.is_current = False
            if not emp.end_date:
                emp.end_date = datetime.utcnow().date()

    new_emp = models.Employment(
        offender_id=offender_id,
        **employment.dict()
    )
    db.add(new_emp)
    
    # Update Status Logic
    if employment.is_current:
        offender = db.query(models.Offender).filter(models.Offender.offender_id == offender_id).first()
        if offender:
            offender.employment_status = "Employed"
            offender.unemployable_reason = None # Clear reason as they are now employed
            
    db.commit()
    db.refresh(new_emp)
    return new_emp

@router.put("/offenders/{offender_id}/employment-status")
def update_employment_status(offender_id: UUID, status_data: dict, db: Session = Depends(get_db)):
    # status_data: { "status": "Unemployed", "reason": "..." }
    offender = db.query(models.Offender).filter(models.Offender.offender_id == offender_id).first()
    if not offender:
        raise HTTPException(status_code=404, detail="Offender not found")
        
    offender.employment_status = status_data.get("status")
    offender.unemployable_reason = status_data.get("reason")
    db.commit()
    return {"status": "success", "employment_status": offender.employment_status}

@router.get("/offenders/{offender_id}/urinalysis", response_model=List[schemas.Urinalysis])
def get_urinalysis(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Urinalysis).filter(models.Urinalysis.offender_id == offender_id).options(joinedload(models.Urinalysis.collected_by)).order_by(models.Urinalysis.date.desc()).all()

@router.post("/offenders/{offender_id}/urinalysis", response_model=schemas.Urinalysis)
def create_urinalysis(offender_id: UUID, ua: schemas.UrinalysisCreate, db: Session = Depends(get_db)):
    # Mock collector for now
    collector = db.query(models.Officer).first()
    
    new_ua = models.Urinalysis(
        offender_id=offender_id,
        collected_by_id=collector.officer_id if collector else None,
        date=ua.date,
        test_type=ua.test_type,
        result=ua.result,
        lab_name=ua.lab_name,
        notes=ua.notes
    )
    db.add(new_ua)
    db.commit()
    db.refresh(new_ua)

    # Trigger Automation Check
    if new_ua.result == "Positive":
       from . import automations
       offender = db.query(models.Offender).filter(models.Offender.offender_id == offender_id).first()
       automations.check_event_triggers("positive_ua", offender, db)

    return new_ua

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


@router.post("/offenders/transfer")
def transfer_offenders(request: schemas.TransferRequest, db: Session = Depends(get_db)):
    """
    Bulk transfer offenders to a new officer.
    Updates active supervision episode and adds a system case note.
    """
    new_officer = db.query(models.Officer).filter(models.Officer.officer_id == request.new_officer_id).first()
    if not new_officer:
        raise HTTPException(status_code=404, detail="New officer not found")

    updated_count = 0
    for oid in request.offender_ids:
        # 1. Update Episode
        episode = db.query(models.SupervisionEpisode).filter(
            models.SupervisionEpisode.offender_id == oid,
            models.SupervisionEpisode.status == 'Active'
        ).first()
        
        if episode:
            old_officer_id = episode.assigned_officer_id
            episode.assigned_officer_id = request.new_officer_id
            updated_count += 1
            
            # 2. Audit Note
            if old_officer_id != request.new_officer_id:
                new_note = models.CaseNote(
                    offender_id=oid,
                    author_id=request.new_officer_id, # Or system user
                    content=f"Case transferred to {new_officer.first_name} {new_officer.last_name}.",
                    type='System',
                    date=datetime.utcnow()
                )
                db.add(new_note)

    db.commit()
    return {"message": f"Successfully transferred {updated_count} offenders"}

@router.put("/offenders/{offender_id}/warrant-status")
def update_warrant_status(offender_id: UUID, update: schemas.WarrantStatusUpdate, db: Session = Depends(get_db)):
    """
    Update warrant status and trigger automated tasks if 'Submitted'.
    """
    offender = db.query(models.Offender).filter(models.Offender.offender_id == offender_id).first()
    if not offender:
        raise HTTPException(status_code=404, detail="Offender not found")
        
    old_status = offender.warrant_status
    offender.warrant_status = update.status
    if update.warrant_date:
        offender.warrant_date = update.warrant_date
        
    # Auto-Task Generation Logic
    if update.status == 'Submitted' and old_status != 'Submitted':
        # 1. Find Supervisor (Approver) and Assigned Officer
        episode = db.query(models.SupervisionEpisode).filter(
            models.SupervisionEpisode.offender_id == offender_id,
            models.SupervisionEpisode.status == 'Active'
        ).first()
        
        officer = episode.officer if episode else None
        supervisor_id = officer.supervisor_id if officer else None
        
        # 2. Create Tasks
        new_tasks = []
        
        # Task A: Supervisor Approval (if supervisor exists)
        if supervisor_id:
            new_tasks.append(models.Task(
                episode_id=episode.episode_id if episode else None,
                created_by=officer.officer_id if officer else None,
                assigned_officer_id=supervisor_id,
                title=f"Warrant Approval: {offender.last_name}",
                description="Review and approve warrant request.",
                priority="High",
                due_date=datetime.utcnow(),
                status="Pending"
            ))
            
        # Task B: Jail Custody Check (Assigned to Officer)
        if officer:
            new_tasks.append(models.Task(
                episode_id=episode.episode_id if episode else None,
                created_by=officer.officer_id,
                assigned_officer_id=officer.officer_id,
                title=f"Jail Custody Check: {offender.last_name}",
                description="Verify if offender is in custody.",
                priority="High",
                due_date=datetime.utcnow(),
                status="Pending"
            ))
             # Task C: Serve Warrant (Assigned to Officer)
            new_tasks.append(models.Task(
                episode_id=episode.episode_id if episode else None,
                created_by=officer.officer_id,
                assigned_officer_id=officer.officer_id,
                title=f"Serve Warrant: {offender.last_name}",
                description="Coordinate with police to serve warrant.",
                priority="High",
                due_date=datetime.utcnow(),
                status="Pending"
            ))

        db.add_all(new_tasks)

    db.commit()
    return {"status": "success", "warrant_status": offender.warrant_status}

@router.post("/offenders/{offender_id}/residences/move")
def move_offender(offender_id: UUID, move: schemas.MoveRequest, db: Session = Depends(get_db)):
    """
    Move offender to a new address.
    Closes current residence and creates a new one.
    Generates a system note.
    """
    # 1. Get Active Episode
    episode = db.query(models.SupervisionEpisode).filter(
        models.SupervisionEpisode.offender_id == offender_id,
        models.SupervisionEpisode.status == 'Active'
    ).first()
    
    if not episode:
        raise HTTPException(status_code=404, detail="Active supervision episode not found")

    # 2. Find and Close Current Residence
    current_res = db.query(models.Residence).filter(
        models.Residence.episode_id == episode.episode_id,
        models.Residence.is_current == True
    ).first()
    
    old_address = "Unknown"
    if current_res:
        old_address = f"{current_res.address_line_1}, {current_res.city}"
        current_res.is_current = False
        # Set end date to day before new start date
        current_res.end_date = move.start_date # Logic: Ended on that date effectively? Or day before?
        # Usually end date is inclusive or exclusive. Let's say moves on 10th. Old end 10th? New start 10th?
        # If I lived there UNTIL the 10th. 
        # Requirement said: "sets End Date = New Start Date - 1 day"
        from datetime import timedelta
        current_res.end_date = move.start_date - timedelta(days=1)

    # 3. Create New Residence
    new_res = models.Residence(
        episode_id=episode.episode_id,
        address_line_1=move.address_line_1,
        city=move.city,
        state=move.state,
        zip_code=move.zip_code,
        start_date=move.start_date,
        housing_type=move.housing_type,
        is_current=True
    )
    db.add(new_res)
    
    # 4. Generate System Note
    # Need officer name. We don't have auth user object here easily without auth middleware fully populated or passed.
    # We will assume "System" or try to fetch assigned officer.
    # Requirement: "{Officer Name} changed address from '{Old Address}' to '{New Address}'"
    # I'll use the assigned officer of the episode as the "actor" if I can't get the actual user.
    # ideally we use currentUser from context but this is backend.
    # For POC, I will use "System" or the Assigned Officer's name.
    
    assigned_officer = episode.officer
    officer_name = f"{assigned_officer.first_name} {assigned_officer.last_name}" if assigned_officer else "Unknown Officer"
    
    new_address = f"{move.address_line_1}, {move.city}"
    
    note_content = f"{officer_name} changed address from '{old_address}' to '{new_address}'."
    if move.notes:
        note_content += f" Note: {move.notes}"

    new_note = models.CaseNote(
        offender_id=offender_id,
        author_id=episode.assigned_officer_id, # Fallback to assigned officer
        content=note_content,
        type='System',
        date=datetime.utcnow()
    )
    db.add(new_note)

    db.commit()
    return {"status": "success", "message": "Offender moved and note created."}

@router.put("/offenders/{offender_id}")
def update_offender(offender_id: UUID, updates: dict, db: Session = Depends(get_db)):
    offender = db.query(models.Offender).filter(models.Offender.offender_id == offender_id).first()
    if not offender:
        raise HTTPException(status_code=404, detail="Offender not found")
    
    allowed_fields = ['first_name', 'last_name', 'phone', 'gender', 'email', 'release_type', 'release_date', 'reversion_date', 'gang_affiliation', 'special_flags', 'employment_status', 'unemployable_reason']
    
    for field in allowed_fields:
        if field in updates:
            setattr(offender, field, updates[field])
            
    # Handle specific field logic if needed
    if 'employment_status' in updates:
        new_status = updates['employment_status']
        if new_status in ['Unemployed', 'Unemployable', 'Retired']:
            # Close any active employment
            active_employment = db.query(models.Employment).filter(
                models.Employment.offender_id == offender_id, 
                models.Employment.is_current == True
            ).first()
            if active_employment:
                active_employment.is_current = False
                active_employment.end_date = datetime.utcnow().date()

    if 'isSexOffender' in updates:
         # Manage the flag in special_flags list
         flags = offender.special_flags or []
         if updates['isSexOffender'] and "Sex Offender" not in flags:
             flags.append("Sex Offender")
         elif not updates['isSexOffender'] and "Sex Offender" in flags:
             flags.remove("Sex Offender")
         offender.special_flags = flags
        
    db.commit()
    db.refresh(offender)
    return offender
