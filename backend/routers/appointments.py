from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/appointments",
    tags=["appointments"]
)

@router.get("", response_model=List[schemas.Appointment])
def get_appointments(
    officer_id: Optional[str] = None,
    location_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Appointment)

    if location_id:
        query = query.join(models.Officer).filter(models.Officer.location_id == location_id)

    if officer_id:
        # officer_id might be a user_id (from frontend auth context) or an actual officer_id
        # Try to find officer by user_id first
        officer = db.query(models.Officer).filter(models.Officer.user_id == officer_id).first()
        if officer:
            query = query.filter(models.Appointment.officer_id == officer.officer_id)
        else:
            # Assume it's a direct officer_id
            try:
                query = query.filter(models.Appointment.officer_id == officer_id)
            except:
                pass

    if start_date:
        query = query.filter(models.Appointment.date_time >= start_date)
    
    if end_date:
        query = query.filter(models.Appointment.date_time <= end_date)

    return query.order_by(models.Appointment.date_time.asc()).all()
