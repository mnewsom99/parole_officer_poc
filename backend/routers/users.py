from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(tags=["Users & Officers"])

@router.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.get("/roles", response_model=List[schemas.Role])
def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

@router.get("/users", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).options(joinedload(models.User.role)).all()

@router.get("/users/{user_id}/officer", response_model=Optional[schemas.Officer])
def get_officer_by_user(user_id: UUID, db: Session = Depends(get_db)):
    officer = db.query(models.Officer).options(
        joinedload(models.Officer.location),
        joinedload(models.Officer.supervisor)
    ).filter(models.Officer.user_id == user_id).first()
    return officer

@router.put("/users/{user_id}/role", response_model=schemas.User)
def update_user_role(user_id: UUID, role_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if role_update.role_id:
        user.role_id = role_update.role_id
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/status", response_model=schemas.User)
def update_user_status(user_id: UUID, status_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if status_update.is_active is not None:
        user.is_active = status_update.is_active
    
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/reset-password")
def reset_password(user_id: UUID, payload: dict, db: Session = Depends(get_db)):
    """
    Payload: {"new_password": "..."}
    """
    new_password = payload.get("new_password")
    if not new_password or len(new_password) < 4:
        raise HTTPException(status_code=400, detail="Password too short")

    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = auth.get_password_hash(new_password)
    db.commit()
    return {"message": "Password reset successfully"}

@router.post("/users/create", response_model=schemas.User)
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check username/email uniqueness
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth.get_password_hash(user_in.password)
    
    new_user = models.User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_password,
        role_id=user_in.role_id,
        is_active=True
    )
    db.add(new_user)
    db.flush() # get ID

    # Create Officer Profile
    new_officer = models.Officer(
        user_id=new_user.user_id,
        location_id=user_in.location_id,
        supervisor_id=user_in.supervisor_id,
        badge_number=user_in.badge_number,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone_number=""
    )
    db.add(new_officer)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/officers", response_model=List[schemas.Officer])
def get_officers(location_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    query = db.query(models.Officer).options(joinedload(models.Officer.location))
    if location_id:
        query = query.filter(models.Officer.location_id == location_id)
    officers = query.all()
    return officers

@router.put("/officers/{officer_id}", response_model=schemas.Officer)
def update_officer(officer_id: UUID, officer_update: schemas.OfficerUpdate, db: Session = Depends(get_db)):
    officer = db.query(models.Officer).options(joinedload(models.Officer.location), joinedload(models.Officer.supervisor)).filter(models.Officer.officer_id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    if officer_update.first_name:
        officer.first_name = officer_update.first_name
    if officer_update.last_name:
        officer.last_name = officer_update.last_name
    if officer_update.phone_number:
        officer.phone_number = officer_update.phone_number
    if officer_update.cell_phone is not None:
        officer.cell_phone = officer_update.cell_phone
    if officer_update.location_id:
        officer.location_id = officer_update.location_id
    if officer_update.supervisor_id:
        officer.supervisor_id = officer_update.supervisor_id
        
    # Update associated User email if provided
    if officer_update.email and officer.user_id:
        user = db.query(models.User).filter(models.User.user_id == officer.user_id).first()
        if user:
            user.email = officer_update.email
            db.add(user) # Ensure user update is tracked
            
    db.commit()
    db.refresh(officer)
    return officer
