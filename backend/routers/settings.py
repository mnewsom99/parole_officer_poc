from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID
from datetime import datetime
import json

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["Settings"])

@router.get("/settings/system", response_model=List[schemas.SystemSetting])
def get_system_settings(db: Session = Depends(get_db)):
    return db.query(models.SystemSettings).all()

@router.put("/settings/system/{key}")
def update_system_setting(key: str, setting_in: schemas.SystemSettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == key).first()
    if not setting:
        # Create if not exists (upsertish)
        setting = models.SystemSettings(key=key, value=setting_in.value)
        db.add(setting)
    else:
        setting.value = setting_in.value
        setting.updated_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Setting updated"}

@router.get("/settings/note-types", response_model=List[schemas.NoteTypeConfig])
def get_note_types(db: Session = Depends(get_db)):
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == "note_types").first()
    if not setting:
        # Default types with colors
        return [
            {"name": "General", "color": "bg-slate-100 text-slate-700"},
            {"name": "Home Visit", "color": "bg-blue-100 text-blue-700"},
            {"name": "Field Visit", "color": "bg-green-100 text-green-700"},
            {"name": "Office Visit", "color": "bg-purple-100 text-purple-700"},
            {"name": "Violation", "color": "bg-red-100 text-red-700"},
            {"name": "Phone Call", "color": "bg-yellow-100 text-yellow-700"},
            {"name": "Next Report Date", "color": "bg-cyan-100 text-cyan-700"},
            {"name": "System", "color": "bg-slate-100 text-slate-700 border-slate-200"}
        ]
    data = json.loads(setting.value)
    # Handle legacy simple string list if exists
    if data and isinstance(data[0], str):
         return [{"name": t, "color": "bg-slate-100 text-slate-700"} for t in data]
    return data

@router.put("/settings/note-types", response_model=List[schemas.NoteTypeConfig])
def update_note_types(update: schemas.NoteTypeUpdate, db: Session = Depends(get_db)):
    # Convert Pydantic models to dicts for JSON serialization
    types_data = [t.dict() for t in update.types]
    
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == "note_types").first()
    if not setting:
        setting = models.SystemSettings(key="note_types", value=json.dumps(types_data))
        db.add(setting)
    else:
        setting.value = json.dumps(types_data)
    
    db.commit()
    return update.types

@router.get("/settings/appointment-types", response_model=List[schemas.AppointmentTypeConfig])
def get_appointment_types(db: Session = Depends(get_db)):
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == "appointment_types").first()
    if not setting:
        # Default types
        return [
            {"name": "Routine Check-in"},
            {"name": "Risk Assessment Review"},
            {"name": "UA Testing"},
            {"name": "Case Plan Update"}
        ]
    data = json.loads(setting.value)
    return data

@router.put("/settings/appointment-types", response_model=List[schemas.AppointmentTypeConfig])
def update_appointment_types(update: schemas.AppointmentTypeUpdate, db: Session = Depends(get_db)):
    types_data = [t.dict() for t in update.types]
    
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == "appointment_types").first()
    if not setting:
        setting = models.SystemSettings(key="appointment_types", value=json.dumps(types_data))
        db.add(setting)
    else:
        setting.value = json.dumps(types_data)
    
    db.commit()
    return update.types

@router.get("/settings/appointment-locations", response_model=List[schemas.AppointmentLocationConfig])
def get_appointment_locations(db: Session = Depends(get_db)):
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == "appointment_locations").first()
    if not setting:
        # Default locations
        return [
            {"name": "Field Office (Main St)"},
            {"name": "Home Visit"},
            {"name": "Employment Site"},
            {"name": "Virtual / Phone"}
        ]
    data = json.loads(setting.value)
    return data

@router.put("/settings/appointment-locations", response_model=List[schemas.AppointmentLocationConfig])
def update_appointment_locations(update: schemas.AppointmentLocationUpdate, db: Session = Depends(get_db)):
    locs_data = [t.dict() for t in update.locations]
    
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == "appointment_locations").first()
    if not setting:
        setting = models.SystemSettings(key="appointment_locations", value=json.dumps(locs_data))
        db.add(setting)
    else:
        setting.value = json.dumps(locs_data)
    
    db.commit()
    return update.locations

@router.get("/locations", response_model=List[schemas.Location])
def get_locations(db: Session = Depends(get_db)):
    return db.query(models.Location).all()

# --- Territory Management ---

@router.get("/territories", response_model=List[schemas.Territory])
def get_territories(db: Session = Depends(get_db)):
    territories = db.query(models.Territory).options(
        joinedload(models.Territory.officers),
        joinedload(models.Territory.location)
    ).all()
    # Pydantic will access .officers and .location from the ORM object
    # We populate assigned_officer_ids manually for convenience if needed by frontend form
    for t in territories:
        t.assigned_officer_ids = [o.officer_id for o in t.officers]
    return territories

@router.post("/territories", response_model=schemas.Territory)
def create_or_update_territory(territory: schemas.TerritoryCreate, db: Session = Depends(get_db)):
    db_territory = db.query(models.Territory).filter(models.Territory.zip_code == territory.zip_code).first()
    
    # Resolve officer IDs to instances
    officers = []
    if territory.assigned_officer_ids:
        officers = db.query(models.Officer).filter(models.Officer.officer_id.in_(territory.assigned_officer_ids)).all()

    if db_territory:
        # Update
        db_territory.region_name = territory.region_name
        db_territory.assigned_location_id = territory.assigned_location_id
        db_territory.officers = officers # Update relationship
    else:
        # Create
        db_territory = models.Territory(
            zip_code=territory.zip_code,
            region_name=territory.region_name,
            assigned_location_id=territory.assigned_location_id
        )
        db_territory.officers = officers
        db.add(db_territory)
    
    db.commit()
    db.refresh(db_territory)
    db_territory.assigned_officer_ids = [o.officer_id for o in db_territory.officers]
    return db_territory

@router.delete("/territories/{zip_code}")
def delete_territory(zip_code: str, db: Session = Depends(get_db)):
    db_territory = db.query(models.Territory).filter(models.Territory.zip_code == zip_code).first()
    if not db_territory:
        raise HTTPException(status_code=404, detail="Territory not found")
    
    db.delete(db_territory)
    db.commit()
    return {"message": "Territory deleted"}

@router.get("/special-assignments", response_model=List[schemas.SpecialAssignment])
def get_special_assignments(db: Session = Depends(get_db)):
    return db.query(models.SpecialAssignment).order_by(models.SpecialAssignment.priority).all()

@router.post("/special-assignments", response_model=schemas.SpecialAssignment)
def create_special_assignment(assignment: schemas.SpecialAssignmentCreate, db: Session = Depends(get_db)):
    new_assignment = models.SpecialAssignment(**assignment.dict())
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

@router.put("/special-assignments/{assignment_id}", response_model=schemas.SpecialAssignment)
def update_special_assignment(assignment_id: UUID, update: schemas.SpecialAssignmentUpdate, db: Session = Depends(get_db)):
    db_assignment = db.query(models.SpecialAssignment).filter(models.SpecialAssignment.assignment_id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    for key, value in update.dict(exclude_unset=True).items():
        setattr(db_assignment, key, value)
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.delete("/special-assignments/{assignment_id}")
def delete_special_assignment(assignment_id: UUID, db: Session = Depends(get_db)):
    db_assignment = db.query(models.SpecialAssignment).filter(models.SpecialAssignment.assignment_id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(db_assignment)
    db.commit()
    return {"message": "Assignment deleted"}
