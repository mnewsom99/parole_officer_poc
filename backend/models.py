from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Text, JSON, Float, Uuid as UUID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime

Base = declarative_base()

class Role(Base):
    __tablename__ = 'roles'
    role_id = Column(Integer, primary_key=True)
    role_name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))

class User(Base):
    __tablename__ = 'users'
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.role_id'), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    is_active = Column(Boolean, default=True)

    role = relationship("Role")

class Location(Base):
    __tablename__ = 'locations'
    location_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False, index=True)
    zip_code = Column(String(10), index=True)
    phone = Column(String(50))
    fax = Column(String(50))

    territories = relationship("Territory", back_populates="location")

class Officer(Base):
    __tablename__ = 'officers'
    officer_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), index=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey('locations.location_id'), index=True)
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), nullable=True, index=True)
    badge_number = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False, index=True)
    phone_number = Column(String(50))
    cell_phone = Column(String(50))

    user = relationship("User")
    location = relationship("Location")
    supervisor = relationship("Officer", remote_side=[officer_id])
    territories = relationship("Territory", secondary="territory_officers", back_populates="officers")

class Offender(Base):
    __tablename__ = 'offenders'
    offender_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    badge_id = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False, index=True)
    dob = Column(Date, nullable=False)
    image_url = Column(String(255))
    phone = Column(String(50))
    gender = Column(String(20))
    gang_affiliation = Column(String(100))
    release_date = Column(Date)
    reversion_date = Column(Date)
    release_type = Column(String(50))
    initial_placement = Column(String(100))
    
    # IDs & Statuses
    csed_date = Column(Date) # Community Supervision End Date
    
    # Dynamic Flags: ["SMI", "Veteran", "Sex Offender", "GPS", "Gang Member"]
    special_flags = Column(JSON, default=list)
    
    housing_status = Column(String(50)) # e.g. "Home Arrest"
    icots_number = Column(String(50))
    employment_status = Column(String(50)) # Employed, Unemployed, Unemployable
    unemployable_reason = Column(String(50)) # SSI, SMI, etc.
    
    # Warrant Status
    warrant_status = Column(String(50), default='None') # None, Submitted, Approved, Issued, Served, Cleared
    warrant_date = Column(Date)
    
    general_comments = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Program(Base):
    __tablename__ = 'programs'
    program_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    provider = Column(String(100))
    status = Column(String(20), default='Pending')
    start_date = Column(Date)
    end_date = Column(Date)
    notes = Column(Text)

    offender = relationship("Offender")

class SupervisionEpisode(Base):
    __tablename__ = 'supervision_episodes'
    episode_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), index=True)
    assigned_officer_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    status = Column(String(20), nullable=False, index=True)
    risk_level_at_start = Column(String(20), nullable=False)
    current_risk_level = Column(String(20)) # Updated by Risk Assessments
    closing_reason = Column(String(100))

    offender = relationship("Offender")
    officer = relationship("Officer")

class Task(Base):
    __tablename__ = 'tasks'
    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    episode_id = Column(UUID(as_uuid=True), ForeignKey('supervision_episodes.episode_id'), index=True)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), nullable=True, index=True) # Added for direct link
    created_by = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), index=True)
    assigned_officer_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(String(50))
    sub_category = Column(String(50))
    due_date = Column(Date)
    status = Column(String(20), default='Pending', index=True)
    is_parole_plan = Column(Boolean, default=False) # New field
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    episode = relationship("SupervisionEpisode")
    offender = relationship("Offender") # Added relationship
    creator = relationship("Officer", foreign_keys=[created_by])
    assigned_officer = relationship("Officer", foreign_keys=[assigned_officer_id])

class FeeBalance(Base):
    __tablename__ = 'fee_balances'
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), primary_key=True)
    balance = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)

    offender = relationship("Offender")

class FeeTransaction(Base):
    __tablename__ = 'fee_transactions'
    transaction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), index=True)
    transaction_date = Column(Date, nullable=False)
    type = Column(String(50)) # Charge, Payment, Adjustment
    amount = Column(Float, nullable=False)
    description = Column(String(255))
    
    offender = relationship("Offender")

class Residence(Base):
    __tablename__ = 'residences'
    residence_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    episode_id = Column(UUID(as_uuid=True), ForeignKey('supervision_episodes.episode_id'), index=True)
    address_line_1 = Column(String(255), nullable=False)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    housing_type = Column(String, nullable=True) # e.g. "Residence", "Homeless", "Halfway House"
    is_current = Column(Boolean, default=True, index=True)
    special_assignment_id = Column(UUID(as_uuid=True), ForeignKey('special_assignments.assignment_id'), nullable=True, index=True)

    episode = relationship("SupervisionEpisode", backref="residences")
    special_assignment = relationship("SpecialAssignment")
    contacts = relationship("ResidenceContact", backref="residence")

class ResidenceContact(Base):
    __tablename__ = 'residence_contacts'
    contact_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    residence_id = Column(UUID(as_uuid=True), ForeignKey('residences.residence_id'), index=True)
    name = Column(String(100), nullable=False)
    relation = Column(String(50))
    phone = Column(String(20))
    comments = Column(Text)

class Employment(Base):
    __tablename__ = 'employments'
    employment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), index=True)
    employer_name = Column(String(100), nullable=False)
    address_line_1 = Column(String(255))
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(10))
    phone = Column(String(20))
    supervisor = Column(String(100))
    pay_rate = Column(String(50)) # e.g. "$15/hr"
    is_current = Column(Boolean, default=True)
    start_date = Column(Date)
    end_date = Column(Date)
    
    offender = relationship("Offender", backref="employments")

class Urinalysis(Base):
    __tablename__ = 'urinalysis'
    test_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), index=True)
    date = Column(Date, nullable=False)
    test_type = Column(String(50)) # Random, Scheduled
    result = Column(String(50)) # Negative, Positive (Substance)
    lab_name = Column(String(100))
    collected_by_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), index=True)
    notes = Column(Text)

    offender = relationship("Offender")
    collected_by = relationship("Officer")

class CaseNote(Base):
    __tablename__ = 'case_notes'
    note_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), index=True)
    date = Column(DateTime, default=datetime.utcnow)
    content = Column(Text, nullable=False)
    type = Column(String(50), default='General')
    is_pinned = Column(Boolean, default=False)

    offender = relationship("Offender")
    author = relationship("Officer")

class Document(Base):
    __tablename__ = 'documents'
    document_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), nullable=True, index=True)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), nullable=True, index=True)
    note_id = Column(UUID(as_uuid=True), ForeignKey('case_notes.note_id'), nullable=True, index=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey('tasks.task_id'), nullable=True, index=True)
    
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False) # Parameters relative to media root
    file_type = Column(String(100)) # MIME type
    category = Column(String(50), default='General') # General, Court, Note Attachment, Task Attachment
    file_size = Column(Integer) # Bytes
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    offender = relationship("Offender")
    uploaded_by = relationship("Officer")
    note = relationship("CaseNote", backref="documents")
    task = relationship("Task", backref="documents")

class RiskAssessmentType(Base):
    __tablename__ = 'risk_assessment_types'
    type_id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False) # e.g. "ORAS"
    description = Column(String(255))
    scoring_matrix = Column(JSON) # e.g. [{"label": "Low", "min": 0, "max": 14}, ...]

class RiskAssessmentQuestion(Base):
    __tablename__ = 'risk_assessment_questions'
    question_id = Column(Integer, primary_key=True)
    universal_tag = Column(String(50), unique=True, nullable=False, index=True) # e.g., 'employment_status'
    question_text = Column(String(255), nullable=False)
    input_type = Column(String(50)) # 'boolean', 'select', 'date', 'integer', 'scale_0_3'
    source_type = Column(String(20)) # 'static', 'dynamic'
    assessments_list = Column(String(255)) # Pipe-separated: 'ORAS|Static-99R'
    category = Column(String(50)) # NEW: Grouping (e.g. 'Criminal History')
    scoring_note = Column(String(255)) # Description of logic
    options = Column(JSON) # e.g., [{"label": "Yes", "value": 1}, {"label": "No", "value": 0}]

class RiskAssessment(Base):
    __tablename__ = 'risk_assessments'
    assessment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), index=True)
    date = Column(Date, nullable=False)
    assessment_type = Column(String(50)) # NEW: 'ORAS', 'Static-99R', etc.
    status = Column(String(20), default='Draft') # NEW: 'Draft', 'Completed'
    total_score = Column(Integer)
    risk_level = Column(String(20)) # Calculated Level (Baseline)
    final_risk_level = Column(String(20)) # Actual Level Applied (Override/Underride)
    override_reason = Column(String(255)) # Reason for override
    details = Column(JSON) # Store factor breakdown as JSON

    offender = relationship("Offender")
    answers = relationship("RiskAssessmentAnswer", back_populates="assessment", foreign_keys="RiskAssessmentAnswer.assessment_id")

class RiskAssessmentAnswer(Base):
    __tablename__ = 'risk_assessment_answers'
    answer_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey('risk_assessments.assessment_id'), index=True)
    question_tag = Column(String(50), ForeignKey('risk_assessment_questions.universal_tag'), index=True)
    value = Column(JSON) # Store as JSON to handle strings, bools, or numbers flexibly
    is_imported = Column(Boolean, default=False) # True if auto-filled by "Look-Back" logic
    source_assessment_id = Column(UUID(as_uuid=True), ForeignKey('risk_assessments.assessment_id'), nullable=True)

    assessment = relationship("RiskAssessment", back_populates="answers", foreign_keys=[assessment_id])
    question = relationship("RiskAssessmentQuestion")

class Appointment(Base):
    __tablename__ = 'appointments'
    appointment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), index=True)
    officer_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), index=True)
    date_time = Column(DateTime, nullable=False)
    location = Column(String(100))
    type = Column(String(50)) # Routine, UA, etc.
    status = Column(String(20), default='Scheduled') # Scheduled, Completed, Missed
    notes = Column(Text)

    offender = relationship("Offender")
    officer = relationship("Officer")

class SystemSettings(Base):
    __tablename__ = 'system_settings'
    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(Text)

class Territory(Base):
    __tablename__ = 'territories'
    zip_code = Column(String(10), primary_key=True)
    assigned_location_id = Column(UUID(as_uuid=True), ForeignKey('locations.location_id'), nullable=True, index=True)
    region_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="territories")
    officers = relationship("Officer", secondary="territory_officers", back_populates="territories")

class TerritoryOfficer(Base):
    __tablename__ = 'territory_officers'
    zip_code = Column(String(10), ForeignKey('territories.zip_code'), primary_key=True)
    officer_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), primary_key=True)
    is_primary = Column(Boolean, default=False)

class SpecialAssignment(Base):
    __tablename__ = 'special_assignments'
    assignment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String(50)) # Facility, Specialty, Admin
    name = Column(String(100))
    address = Column(String(255))
    zip_code = Column(String(10))
    assigned_officer_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), index=True)
    priority = Column(Integer, default=1)

    officer = relationship("Officer")

class FormTemplate(Base):
    __tablename__ = 'form_templates'
    template_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    form_schema = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class FormSubmission(Base):
    __tablename__ = 'form_submissions'
    submission_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey('form_templates.template_id'), index=True)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'), nullable=True, index=True)
    assigned_to_user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=True, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), index=True)
    form_data = Column(JSON)
    status = Column(String(50), default='Draft', index=True)
    is_locked = Column(Boolean, default=False)
    current_step = Column(String(50), default='Draft')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    template = relationship("FormTemplate")
    offender = relationship("Offender")
    assigned_to = relationship("User", foreign_keys=[assigned_to_user_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    logs = relationship("WorkflowLog", back_populates="submission")

class WorkflowLog(Base):
    __tablename__ = 'workflow_logs'
    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey('form_submissions.submission_id'), index=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), index=True)
    action = Column(String(50), nullable=False)
    comment = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

    submission = relationship("FormSubmission", back_populates="logs")
    actor = relationship("User")


class AutomationRule(Base):
    __tablename__ = 'automation_rules'

    rule_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    
    # Trigger Definition
    trigger_field = Column(String(50), nullable=False) # e.g. 'release_date', 'csed_date'
    trigger_offset = Column(Integer, default=0) # Number of days
    trigger_direction = Column(String(10), default='after') # 'before' or 'after'
    
    # Conditions (Stored as JSON list of objects: {field, operator, value})
    conditions = Column(JSON, default=list)
    
    # Action Definition (Task Template)
    action_type = Column(String(50), default='create_task')
    task_title = Column(String(200), nullable=False)
    task_description = Column(Text)
    task_priority = Column(String(20), default='Normal')
    due_offset = Column(Integer, default=7) # Days from trigger date to due date
    action_is_parole_plan = Column(Boolean, default=False) # New field
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)




# --- Generic Assessment Engine Models ---

class AssessmentInstrument(Base):
    __tablename__ = 'assessment_instruments'
    instrument_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False) # e.g. "ORAS-CST"
    version = Column(String(50)) # e.g. "v1.0"
    target_populations = Column(JSON) # e.g. ["Male", "Female"]
    scoring_method = Column(String(50), default='Additive') # Additive, Weighted
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    domains = relationship("AssessmentDomain", back_populates="instrument", cascade="all, delete-orphan")
    scoring_tables = relationship("ScoringTable", back_populates="instrument", cascade="all, delete-orphan")

class AssessmentDomain(Base):
    __tablename__ = 'assessment_domains'
    domain_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instrument_id = Column(UUID(as_uuid=True), ForeignKey('assessment_instruments.instrument_id'), index=True)
    name = Column(String(100), nullable=False) # e.g. "Criminal History"
    order_index = Column(Integer, default=0)
    max_score = Column(Integer) # For visual gauges
    
    instrument = relationship("AssessmentInstrument", back_populates="domains")
    items = relationship("AssessmentItem", back_populates="domain", cascade="all, delete-orphan")

class AssessmentItem(Base):
    __tablename__ = 'assessment_items'
    item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain_id = Column(UUID(as_uuid=True), ForeignKey('assessment_domains.domain_id'), index=True)
    text = Column(String(500), nullable=False) # The Question
    control_type = Column(String(50), default='Radio') # Radio, Checkbox, NumberInput
    order_index = Column(Integer, default=0)
    custom_tags = Column(JSON) # e.g. ["Employment", "Needs"]
    
    domain = relationship("AssessmentDomain", back_populates="items")
    options = relationship("AssessmentOption", back_populates="item", cascade="all, delete-orphan")

class AssessmentOption(Base):
    __tablename__ = 'assessment_options'
    option_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey('assessment_items.item_id'), index=True)
    label = Column(String(255), nullable=False) # Display text
    value = Column(String(50)) # Backend value (e.g. "0", "1", "yes")
    points = Column(Integer, default=0) # Score contribution
    order_index = Column(Integer, default=0)

    item = relationship("AssessmentItem", back_populates="options")

class ScoringTable(Base):
    __tablename__ = 'scoring_tables'
    table_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instrument_id = Column(UUID(as_uuid=True), ForeignKey('assessment_instruments.instrument_id'), index=True)
    domain_id = Column(UUID(as_uuid=True), ForeignKey('assessment_domains.domain_id'), nullable=True) # If null, applies to Total Score
    population_filter = Column(String(50)) # e.g. "Male", "Female", or "All"
    min_score = Column(Integer, nullable=False)
    max_score = Column(Integer, nullable=False)
    result_level = Column(String(50), nullable=False) # e.g. "High", "Moderate"
    recommendation = Column(Text) # Actionable output

    instrument = relationship("AssessmentInstrument", back_populates="scoring_tables")
    domain = relationship("AssessmentDomain")
