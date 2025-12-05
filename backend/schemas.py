from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from uuid import UUID

class LocationBase(BaseModel):
    name: str
    address: str
    type: str

class Location(LocationBase):
    location_id: UUID

    class Config:
        from_attributes = True

class OfficerBase(BaseModel):
    badge_number: str
    first_name: str
    last_name: str

class Officer(OfficerBase):
    officer_id: UUID
    location_id: Optional[UUID] = None
    location: Optional[Location] = None
    
    class Config:
        from_attributes = True

class OffenderBase(BaseModel):
    badge_id: str
    first_name: str
    last_name: str
    dob: date
    image_url: Optional[str] = None

class Offender(OffenderBase):
    offender_id: UUID
    
    class Config:
        from_attributes = True

class SupervisionEpisodeBase(BaseModel):
    start_date: date
    status: str
    risk_level_at_start: str

class FacilityBase(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    services_offered: Optional[str] = None

class Facility(FacilityBase):
    facility_id: UUID

    class Config:
        from_attributes = True

class ResidenceContactBase(BaseModel):
    name: str
    relation: Optional[str] = None
    phone: Optional[str] = None
    comments: Optional[str] = None

class ResidenceContact(ResidenceContactBase):
    contact_id: UUID
    residence_id: UUID

    class Config:
        from_attributes = True

class ResidenceBase(BaseModel):
    address_line_1: str
    city: str
    state: str
    zip_code: str
    is_current: bool

class Residence(ResidenceBase):
    residence_id: UUID
    episode_id: UUID
    facility_id: Optional[UUID] = None
    facility: Optional[Facility] = None
    contacts: List[ResidenceContact] = []

    class Config:
        from_attributes = True

class SupervisionEpisode(SupervisionEpisodeBase):
    episode_id: UUID
    offender_id: UUID
    assigned_officer_id: UUID
    offender: Optional[Offender] = None
    residences: List[Residence] = []
    
    class Config:
        from_attributes = True

class OffenderCreate(BaseModel):
    first_name: str
    last_name: str
    badge_id: str
    dob: date
    image_url: Optional[str] = None
    
    # Nested creation data
    address_line_1: str
    city: str
    state: str
    zip_code: str
    
    # Supervision details
    start_date: date
    end_date: Optional[date] = None
    risk_level: str
    assigned_officer_id: Optional[UUID] = None

class UrinalysisBase(BaseModel):
    date: date
    test_type: Optional[str] = None
    result: Optional[str] = None
    lab_name: Optional[str] = None
    notes: Optional[str] = None

class Urinalysis(UrinalysisBase):
    test_id: UUID
    offender_id: UUID
    collected_by_id: Optional[UUID] = None
    collected_by: Optional[Officer] = None

    class Config:
        from_attributes = True

class CaseNoteBase(BaseModel):
    content: str
    type: Optional[str] = 'General'
    is_pinned: Optional[bool] = False
    date: Optional[datetime] = None

class NoteTypeConfig(BaseModel):
    name: str
    color: str

class NoteTypeUpdate(BaseModel):
    types: List[NoteTypeConfig]

class CaseNote(CaseNoteBase):
    note_id: UUID
    offender_id: UUID
    author_id: Optional[UUID] = None
    author: Optional[Officer] = None
    type: Optional[str] = 'General'
    is_pinned: Optional[bool] = False

    class Config:
        from_attributes = True

class RiskAssessmentBase(BaseModel):
    date: date
    total_score: Optional[int] = None
    risk_level: Optional[str] = None
    details: Optional[dict] = None

class RiskAssessment(RiskAssessmentBase):
    assessment_id: UUID
    offender_id: UUID

    class Config:
        from_attributes = True

class AppointmentBase(BaseModel):
    date_time: datetime
    location: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Appointment(AppointmentBase):
    appointment_id: UUID
    offender_id: UUID
    officer_id: Optional[UUID] = None
    officer: Optional[Officer] = None

    class Config:
        from_attributes = True

