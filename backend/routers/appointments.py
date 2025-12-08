from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import uuid
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/appointments",
    tags=["appointments"]
)

@router.post("", response_model=schemas.Appointment)
def create_appointment(
    appointment: schemas.AppointmentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify offender exists
    offender = db.query(models.Offender).filter(models.Offender.offender_id == appointment.offender_id).first()
    if not offender:
        raise HTTPException(status_code=404, detail="Offender not found")

    new_appointment = models.Appointment(
        **appointment.dict()
    )
    
    # Logic for assigned officer: 
    # If not provided, maybe default to user's officer profile?
    if not new_appointment.officer_id:
         officer = db.query(models.Officer).filter(models.Officer.user_id == current_user.user_id).first()
         if officer:
             new_appointment.officer_id = officer.officer_id

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    return new_appointment

@router.get("", response_model=List[schemas.Appointment])
def get_appointments(
    officer_id: Optional[str] = None, # can be user_id or officer_id
    assigned_officer_id: Optional[str] = None, # Explicit officer ID
    location_id: Optional[str] = None,
    appointment_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Appointment)

    if location_id:
        query = query.join(models.Officer).filter(models.Officer.location_id == location_id)

    # Robust explicit ID check first
    if assigned_officer_id:
        query = query.filter(models.Appointment.officer_id == assigned_officer_id)
    
    # Fallback/Legacy ID check
    # Fallback/Legacy ID check
    elif officer_id:
        # officer_id might be a user_id (from frontend auth context) or an actual officer_id
        # Try to find officer by user_id first
        try:
            # Check if input is a valid UUID first to prevent errors
            officer_uuid = uuid.UUID(str(officer_id))
            
            officer = db.query(models.Officer).filter(models.Officer.user_id == officer_uuid).first()
            if officer:
                query = query.filter(models.Appointment.officer_id == officer.officer_id)
            else:
                # Assume it's a direct officer_id
                query = query.filter(models.Appointment.officer_id == officer_uuid)
        except ValueError:
            # If not a valid UUID, maybe it's some other ID format? For now, ignore or return empty?
            # If provided ID is junk, we probably shouldn't return ALL records.
            # Let's fail safe and return nothing if ID is invalid.
             query = query.filter(models.Appointment.officer_id == None) # Impossible condition to return empty
             pass
    
    if appointment_type:
        query = query.filter(models.Appointment.type == appointment_type)

    if start_date:
        query = query.filter(models.Appointment.date_time >= start_date)
    
    if end_date:
        query = query.filter(models.Appointment.date_time <= end_date)

    return query.order_by(models.Appointment.date_time.asc()).all()

@router.get("/{appointment_id}", response_model=schemas.Appointment)
def get_appointment(
    appointment_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.put("/{appointment_id}", response_model=schemas.Appointment)
def update_appointment(
    appointment_id: str,
    appointment_update: schemas.AppointmentUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_data = appointment_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(appointment, key, value)
    
    db.commit()
    db.refresh(appointment)
    return appointment

@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(models.Appointment).filter(models.Appointment.appointment_id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db.delete(appointment)
    db.commit()
    return {"ok": True}
