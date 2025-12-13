from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional
from uuid import UUID
from datetime import date
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(
    prefix="/programs",
    tags=["programs"]
)

# --- Provider Management ---

@router.get("/providers", response_model=List[schemas.ProgramProvider])
def get_providers(db: Session = Depends(get_db)):
    return db.query(models.ProgramProvider).all()

@router.post("/providers", response_model=schemas.ProgramProvider)
def create_provider(provider: schemas.ProgramProviderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_provider = models.ProgramProvider(**provider.dict())
    db.add(db_provider)
    db.commit()
    db.refresh(db_provider)
    return db_provider

# --- Program Catalog (Offerings) ---

@router.get("/catalog", response_model=List[schemas.ProgramOffering])
def get_program_catalog(provider_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    query = db.query(models.ProgramOffering).options(joinedload(models.ProgramOffering.provider))
    if provider_id:
        query = query.filter(models.ProgramOffering.provider_id == provider_id)
    return query.all()

@router.post("/catalog", response_model=schemas.ProgramOffering)
def create_offering(offering: schemas.ProgramOfferingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_offering = models.ProgramOffering(**offering.dict())
    db.add(db_offering)
    db.commit()
    db.refresh(db_offering)
    return db_offering

# --- Enrollment Management ---

@router.get("/enrollments/offender/{offender_id}", response_model=List[schemas.ProgramEnrollment])
def get_offender_enrollments(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.ProgramEnrollment)\
        .options(joinedload(models.ProgramEnrollment.offering).joinedload(models.ProgramOffering.provider))\
        .filter(models.ProgramEnrollment.offender_id == offender_id)\
        .all()

@router.get("/enrollments", response_model=List[schemas.ProgramEnrollment])
def get_enrollments(
    provider_name: Optional[str] = None,
    program_name: Optional[str] = None,
    office: Optional[str] = None,
    officer_name_part: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.ProgramEnrollment)\
        .join(models.Offender)\
        .join(models.ProgramOffering)\
        .join(models.ProgramProvider)\
        .options(
            joinedload(models.ProgramEnrollment.offender),
            joinedload(models.ProgramEnrollment.offering).joinedload(models.ProgramOffering.provider)
        )

    # Basic relationships needed for filtering
    if office or officer_name_part:
        query = query.join(models.SupervisionEpisode, models.SupervisionEpisode.offender_id == models.Offender.offender_id)\
                     .filter(models.SupervisionEpisode.status == 'Active')\
                     .join(models.Officer, models.SupervisionEpisode.assigned_officer_id == models.Officer.officer_id)\
                     .join(models.Location, models.Officer.location_id == models.Location.location_id)
                     
        if office:
            query = query.filter(models.Location.name == office)
        
        if officer_name_part:
            query = query.filter(
                or_(
                    models.Officer.last_name.ilike(f"%{officer_name_part}%"),
                    models.Officer.first_name.ilike(f"%{officer_name_part}%")
                )
            )

    if provider_name:
        query = query.filter(models.ProgramProvider.name == provider_name)

    if program_name:
        query = query.filter(models.ProgramOffering.program_name == program_name)

    if start_date:
        query = query.filter(models.ProgramEnrollment.start_date >= start_date)
    
    if end_date:
        query = query.filter(models.ProgramEnrollment.start_date <= end_date)

    if status:
        # status is a list, usage: ?status=Enrolled&status=Attending
        query = query.filter(models.ProgramEnrollment.status.in_(status))

    return query.all()

@router.post("/enrollments", response_model=schemas.ProgramEnrollment)
def enroll_offender(enrollment: schemas.ProgramEnrollmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_enrollment = models.ProgramEnrollment(**enrollment.dict())
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment

@router.put("/enrollments/{enrollment_id}", response_model=schemas.ProgramEnrollment)
def update_enrollment(enrollment_id: UUID, update: schemas.ProgramEnrollmentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_enrollment = db.query(models.ProgramEnrollment).filter(models.ProgramEnrollment.enrollment_id == enrollment_id).first()
    if not db_enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    for key, value in update.dict(exclude_unset=True).items():
        setattr(db_enrollment, key, value)
    
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment

# --- Attendance & Notes ---

@router.post("/enrollments/{enrollment_id}/attendance", response_model=schemas.ProgramAttendance)
def log_attendance(enrollment_id: UUID, attendance: schemas.ProgramAttendanceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_attendance = models.ProgramAttendance(**attendance.dict(), enrollment_id=enrollment_id)
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.post("/enrollments/{enrollment_id}/notes", response_model=schemas.ProgramNote)
def add_program_note(enrollment_id: UUID, note: schemas.ProgramNoteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_note = models.ProgramNote(**note.dict(), enrollment_id=enrollment_id, author_id=current_user.user_id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note
