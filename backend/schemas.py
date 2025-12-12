from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from uuid import UUID
import re

# --- Helpers ---
def format_phone(v: Optional[str]) -> Optional[str]:
    if not v:
        return v
    
    # Remove all non-numeric characters except 'x' (for extension)
    # Also handle common international prefixes to strip them if they are +1
    clean_v = v.strip()
    
    # Remove leading +1 or 1 if present (US Country Code)
    if clean_v.startswith('+1'):
        clean_v = clean_v[2:]
    elif clean_v.startswith('1') and len(re.sub(r'\D', '', clean_v)) == 11:
        clean_v = clean_v[1:]
        
    # Extract digits and potential extension
    # Allow x, ext, extension as separators
    parts = re.split(r'[xX]|ext', clean_v)
    digits = re.sub(r'\D', '', parts[0])
    
    extension = None
    if len(parts) > 1:
        extension = re.sub(r'\D', '', parts[1])
    
    if len(digits) != 10:
        # If it's not a standard 10 digit number, return as is (or could raise error)
        # For now, let's strictly enforce 10 digits for the main part.
        # But to be safe with existing bad data that might slip through migration, 
        # we can just return the cleaned version if it fails match.
        # However, plan said "Validate length is at least 10 digits".
        if len(digits) < 10:
             raise ValueError('Phone number must have at least 10 digits')
        
    formatted = f"({digits[:3]}) {digits[3:6]}-{digits[6:10]}"
    
    if extension:
        formatted += f" x{extension}"
        
    return formatted

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
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None

    @field_validator('phone', 'fax')
    @classmethod
    def validate_phone_numbers(cls, v):
        return format_phone(v)

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    type: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None

    @field_validator('phone', 'fax')
    @classmethod
    def validate_phone_numbers(cls, v):
        return format_phone(v)

class Location(LocationBase):
    location_id: UUID
    # territory relationship if needed

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
    cell_phone: Optional[str] = None

    @field_validator('phone_number', 'cell_phone')
    @classmethod
    def validate_phones(cls, v):
        return format_phone(v)

class OfficerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    cell_phone: Optional[str] = None
    location_id: Optional[UUID] = None
    supervisor_id: Optional[UUID] = None

    @field_validator('phone_number', 'cell_phone')
    @classmethod
    def validate_phones(cls, v):
        return format_phone(v)

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
    phone: Optional[str] = None
    gender: Optional[str] = None
    is_sex_offender: Optional[bool] = False
    is_gang_member: Optional[bool] = False
    gang_affiliation: Optional[str] = None
    release_date: Optional[date] = None
    reversion_date: Optional[date] = None
    release_type: Optional[str] = None
    initial_placement: Optional[str] = None
    initial_placement: Optional[str] = None
    general_comments: Optional[str] = None
    employment_status: Optional[str] = None
    unemployable_reason: Optional[str] = None
    warrant_status: Optional[str] = 'None'
    warrant_date: Optional[date] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        return format_phone(v)

class Offender(OffenderBase):
    offender_id: UUID
    special_flags: List[str] = []
    # employment info will be fetched separately or embedded?
    # Let's verify if we need it here. Typically get_offender_details uses explicit dict construction.
    # But for relationship loading:
    # employments: List['Employment'] = [] 
    # 'Employment' not defined yet unless I use string forward ref or move Offender down.
    # Schemas are order dependent. Offender is line 130. Employment is line 270.
    # I should define Employment BEFORE Offender or use ForwardRef.
    # Or just NOT put it in Offender schema if I don't need nested loading via schema.
    # backend/routers/offenders.py constructs the Dict manually for details.
    # So I might NOT need it in Pydantic 'Offender' model if I don't use it for serialization there.
    # BUT I should keep the fields I added (employment_status) available.
    # I already added employment_status to OffenderBase.
    # I will skip adding 'employments' list to Offender schema to avoid ForwardRef issues for now.
    pass
    
    class Config:
        from_attributes = True

# ... (rest of the file content until end)

class WorkflowAction(BaseModel):
    action: str # Submit, Approve, Deny, Return
    comment: Optional[str] = None
    target_user_id: Optional[UUID] = None # For re-assignment logic

class TransferRequest(BaseModel):
    offender_ids: List[UUID]
    new_officer_id: UUID

class WarrantStatusUpdate(BaseModel):
    status: str # 'Submitted', 'Approved', 'Served', 'Cleared'
    warrant_date: Optional[date] = None

# --- Programs ---
class ProgramBase(BaseModel):
    name: str
    category: str
    provider: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None

class Program(ProgramBase):
    program_id: UUID
    offender_id: UUID

    class Config:
        from_attributes = True

# --- Supervision Episodes ---
class SupervisionEpisodeBase(BaseModel):
    start_date: date
    status: str
    risk_level_at_start: str

# --- Territories ---
class TerritoryBase(BaseModel):
    zip_code: str
    assigned_officer_ids: Optional[List[UUID]] = [] # Changed from single ID to list
    assigned_location_id: Optional[UUID] = None
    region_name: Optional[str] = None

class TerritoryCreate(TerritoryBase):
    pass

class TerritoryUpdate(BaseModel):
    assigned_officer_ids: Optional[List[UUID]] = None
    assigned_location_id: Optional[UUID] = None
    region_name: Optional[str] = None

class Territory(TerritoryBase):
    created_at: datetime
    officers: List[Officer] = [] # Include full officer details
    location: Optional[Location] = None # Include location details

    class Config:
        from_attributes = True

# --- Special Assignments ---
class SpecialAssignmentBase(BaseModel):
    type: str
    name: str
    address: Optional[str] = None
    zip_code: Optional[str] = None
    assigned_officer_id: Optional[UUID] = None
    priority: int = 1

class SpecialAssignmentCreate(SpecialAssignmentBase):
    pass

class SpecialAssignmentUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    zip_code: Optional[str] = None
    assigned_officer_id: Optional[UUID] = None
    priority: Optional[int] = None

class OffenderFlagConfig(BaseModel):
    name: str
    color: str

class OffenderFlagUpdate(BaseModel):
    flags: List[OffenderFlagConfig]

class SpecialAssignment(SpecialAssignmentBase):
    assignment_id: UUID

    class Config:
        from_attributes = True

# --- Facilities (Deprecated - now mapped to SpecialAssignment/Facility) ---
class FacilityBase(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    services_offered: Optional[str] = None
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        return format_phone(v)

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

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        return format_phone(v)

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
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    housing_type: Optional[str] = "Residence"
    is_current: bool = True

class Residence(ResidenceBase):
    residence_id: UUID
    episode_id: UUID
    facility_id: Optional[UUID] = None
    special_assignment_id: Optional[UUID] = None
    facility: Optional[Facility] = None
    special_assignment: Optional[SpecialAssignment] = None
    contacts: List[ResidenceContact] = []

    class Config:
        from_attributes = True

# --- Employment ---
class EmploymentBase(BaseModel):
    employer_name: str
    address_line_1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    supervisor: Optional[str] = None
    pay_rate: Optional[str] = None
    is_current: bool = True
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        return format_phone(v)

class EmploymentCreate(EmploymentBase):
    pass

class EmploymentUpdate(BaseModel):
    employer_name: Optional[str] = None
    address_line_1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    supervisor: Optional[str] = None
    pay_rate: Optional[str] = None
    is_current: Optional[bool] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        return format_phone(v)

class Employment(EmploymentBase):
    employment_id: UUID
    offender_id: UUID

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

# --- Tasks ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[str] = 'Normal'
    assigned_officer_id: UUID
    offender_id: Optional[UUID] = None # Added
    is_parole_plan: Optional[bool] = False # Added

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_officer_id: Optional[UUID] = None
    offender_id: Optional[UUID] = None # Added
    is_parole_plan: Optional[bool] = None # Added

class Task(TaskBase):
    task_id: UUID
    episode_id: Optional[UUID] = None
    created_by: Optional[UUID] = None
    status: Optional[str] = 'Pending'
    created_at: datetime
    updated_at: datetime
    
    offender: Optional[Offender] = None # Added

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

class TaskCategoryConfig(BaseModel):
    name: str
    subcategories: List[str] = []

class TaskCategoryUpdate(BaseModel):
    categories: List[TaskCategoryConfig]

class AppointmentTypeConfig(BaseModel):
    name: str

class AppointmentTypeUpdate(BaseModel):
    types: List[AppointmentTypeConfig]

class AppointmentLocationConfig(BaseModel):
    name: str

class AppointmentLocationUpdate(BaseModel):
    locations: List[AppointmentLocationConfig]

class HousingTypeConfig(BaseModel):
    name: str
    color: str

class HousingTypeUpdate(BaseModel):
    types: List[HousingTypeConfig]

class MoveRequest(BaseModel):
    address_line_1: str
    city: str
    state: str
    zip_code: str
    start_date: date
    housing_type: str
    notes: Optional[str] = None

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
    final_risk_level: Optional[str] = None
    override_reason: Optional[str] = None
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

class AppointmentCreate(AppointmentBase):
    offender_id: UUID
    officer_id: Optional[UUID] = None

class AppointmentUpdate(BaseModel):
    date_time: Optional[datetime] = None
    location: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    officer_id: Optional[UUID] = None

class Appointment(AppointmentBase):
    appointment_id: UUID
    offender_id: UUID
    officer_id: Optional[UUID] = None
    officer: Optional[Officer] = None
    offender: Optional[Offender] = None

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

# --- System Settings ---
class SystemSetting(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SystemSettingUpdate(BaseModel):
    value: str


# --- Workflows & Dynamic Forms ---

class FormTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    form_schema: Dict[str, Any]

class FormTemplateCreate(FormTemplateBase):
    pass

class FormTemplate(FormTemplateBase):
    template_id: UUID
    created_at: datetime
    class Config:
        from_attributes = True

class WorkflowLogBase(BaseModel):
    action: str
    comment: Optional[str] = None
    timestamp: datetime

class WorkflowLog(WorkflowLogBase):
    log_id: UUID
    submission_id: UUID
    actor_id: UUID
    actor: Optional[User] = None # Basic user info
    class Config:
        from_attributes = True

class FormSubmissionBase(BaseModel):
    template_id: UUID
    offender_id: Optional[UUID] = None
    assigned_to_user_id: Optional[UUID] = None
    form_data: Dict[str, Any]

class FormSubmissionCreate(FormSubmissionBase):
    pass

class FormSubmission(FormSubmissionBase):
    submission_id: UUID
    created_by_id: UUID
    status: str
    is_locked: bool
    current_step: str
    created_at: datetime
    updated_at: datetime
    
    template: Optional[FormTemplate] = None
    offender: Optional[Offender] = None
    assigned_to: Optional[User] = None
    created_by: Optional[User] = None
    logs: List[WorkflowLog] = []

    class Config:
        from_attributes = True

class WorkflowAction(BaseModel):
    action: str # Submit, Approve, Deny, Return
    comment: Optional[str] = None
    target_user_id: Optional[UUID] = None # For re-assignment logic


# --- Automation Rules ---
class AutomationRuleBase(BaseModel):
    name: str
    trigger_field: str
    trigger_offset: int
    trigger_direction: str
    conditions: List[Dict[str, Any]] = []
    action_type: str = 'create_task'
    task_title: str
    task_description: Optional[str] = None
    task_priority: Optional[str] = 'Normal'
    due_offset: int = 7
    action_is_parole_plan: bool = False # Added
    is_active: bool = True

class AutomationRuleCreate(AutomationRuleBase):
    pass

class AutomationRule(AutomationRuleBase):
    rule_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Documents ---
class DocumentBase(BaseModel):
    file_name: str
    file_type: Optional[str] = None
    category: Optional[str] = "General"

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    document_id: UUID
    offender_id: UUID
    uploaded_by_id: UUID
    note_id: Optional[UUID] = None
    task_id: Optional[UUID] = None
    file_path: str
    uploaded_at: datetime
    
    # Optional nested objects for display
    # uploader: Optional[Officer] = None

    class Config:
        from_attributes = True

# --- Urinalysis ---
class UrinalysisCreate(BaseModel):
    date: date
    test_type: str = "Random"
    result: str = "Negative"
    lab_name: Optional[str] = None
    notes: Optional[str] = None

class Urinalysis(UrinalysisCreate):
    test_id: UUID
    offender_id: UUID
    collected_by_id: Optional[UUID]
    collected_by: Optional[Officer] = None

    class Config:
        from_attributes = True

# --- Generic Assessment Engine Schemas ---

class AssessmentOptionBase(BaseModel):
    label: str
    value: Optional[str] = None
    points: int = 0
    order_index: int = 0

class AssessmentOptionCreate(AssessmentOptionBase):
    pass

class AssessmentOption(AssessmentOptionBase):
    option_id: UUID
    item_id: UUID
    class Config:
        from_attributes = True

class AssessmentItemBase(BaseModel):
    text: str
    control_type: str = 'Radio'
    order_index: int = 0
    custom_tags: Optional[List[str]] = []

class AssessmentItemCreate(AssessmentItemBase):
    options: List[AssessmentOptionCreate] = []

class AssessmentItem(AssessmentItemBase):
    item_id: UUID
    domain_id: UUID
    options: List[AssessmentOption] = []
    class Config:
        from_attributes = True

class AssessmentDomainBase(BaseModel):
    name: str
    order_index: int = 0
    max_score: Optional[int] = None

class AssessmentDomainCreate(AssessmentDomainBase):
    id: Optional[UUID] = None # For mapping during updates
    items: List[AssessmentItemCreate] = []

class AssessmentDomain(AssessmentDomainBase):
    domain_id: UUID
    instrument_id: UUID
    items: List[AssessmentItem] = []
    class Config:
        from_attributes = True

class ScoringTableBase(BaseModel):
    domain_id: Optional[UUID] = None # None = Total Score
    population_filter: Optional[str] = "All"
    min_score: int
    max_score: int
    result_level: str
    recommendation: Optional[str] = None

class ScoringTableCreate(ScoringTableBase):
    pass

class ScoringTable(ScoringTableBase):
    table_id: UUID
    instrument_id: UUID
    class Config:
        from_attributes = True

class AssessmentInstrumentBase(BaseModel):
    name: str
    version: Optional[str] = None
    target_populations: Optional[List[str]] = []
    scoring_method: Optional[str] = 'Additive'
    is_active: bool = True

class AssessmentInstrumentCreate(AssessmentInstrumentBase):
    domains: List[AssessmentDomainCreate] = []
    scoring_tables: List[ScoringTableCreate] = []

class AssessmentInstrument(AssessmentInstrumentBase):
    instrument_id: UUID
    created_at: datetime
    domains: List[AssessmentDomain] = []
    scoring_tables: List[ScoringTable] = []
    class Config:
        from_attributes = True
