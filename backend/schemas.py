from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from uuid import UUID

# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Roles ---
class RoleBase(BaseModel):
    role_name: str
    description: Optional[str] = None

class Role(RoleBase):
    role_id: int

    class Config:
        from_attributes = True

# --- Locations ---
class LocationBase(BaseModel):
    name: str
    address: str
    type: str

class LocationCreate(LocationBase):
    pass

class Location(LocationBase):
    location_id: UUID

    class Config:
        from_attributes = True

# --- Users ---
class UserBase(BaseModel):
    username: str
    email: str
    role_id: int
    is_active: bool = True

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role_id: int
    first_name: str
    last_name: str
    badge_number: Optional[str] = None
    location_id: Optional[UUID] = None
    supervisor_id: Optional[UUID] = None

class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role_id: Optional[int] = None

class User(UserBase):
    user_id: UUID
    role: Optional[Role] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Officers ---
class OfficerBase(BaseModel):
    badge_number: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None

class OfficerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None

class Officer(OfficerBase):
    officer_id: UUID
    user_id: Optional[UUID] = None
    location_id: Optional[UUID] = None
    location: Optional[Location] = None
    supervisor_id: Optional[UUID] = None
    supervisor: Optional['Officer'] = None
    user: Optional[User] = None
    
    class Config:
        from_attributes = True

Officer.update_forward_refs()

# --- Offenders ---
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

# --- Supervision Episodes ---
class SupervisionEpisodeBase(BaseModel):
    start_date: date
    status: str
    risk_level_at_start: str

# --- Facilities ---
class FacilityBase(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    services_offered: Optional[str] = None

class Facility(FacilityBase):
    facility_id: UUID

    class Config:
        from_attributes = True

# --- Residences ---
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

# --- Others ---
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

class AppointmentTypeConfig(BaseModel):
    name: str

class AppointmentTypeUpdate(BaseModel):
    types: List[AppointmentTypeConfig]

class AppointmentLocationConfig(BaseModel):
    name: str

class AppointmentLocationUpdate(BaseModel):
    locations: List[AppointmentLocationConfig]

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
    details: Optional[Dict[str, Any]] = None

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

# --- Tasks ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = 'Pending'
    episode_id: Optional[UUID] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    episode_id: Optional[UUID] = None

class Task(TaskBase):
    task_id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RiskDistributionItem(BaseModel):
    name: str # 'Low', 'Medium', 'High'
    value: int
    color: str # Hex code

class DashboardStats(BaseModel):
    total_caseload: int
    active_offenders: int
    compliance_rate: float
    pending_reviews: int
    warrants_issued: int
    risk_distribution: List[RiskDistributionItem]
