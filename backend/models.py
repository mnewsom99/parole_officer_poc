from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

Base = declarative_base()

class Role(Base):
    __tablename__ = 'roles'
    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))

class User(Base):
    __tablename__ = 'users'
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.role_id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

    role = relationship("Role")

class Location(Base):
    __tablename__ = 'locations'
    location_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)

class Officer(Base):
    __tablename__ = 'officers'
    officer_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'))
    location_id = Column(UUID(as_uuid=True), ForeignKey('locations.location_id'))
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), nullable=True)
    badge_number = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone_number = Column(String(20))

    user = relationship("User")
    location = relationship("Location")
    supervisor = relationship("Officer", remote_side=[officer_id])

class Offender(Base):
    __tablename__ = 'offenders'
    offender_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    badge_id = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    dob = Column(Date, nullable=False)
    image_url = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class SupervisionEpisode(Base):
    __tablename__ = 'supervision_episodes'
    episode_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'))
    assigned_officer_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    status = Column(String(20), nullable=False)
    risk_level_at_start = Column(String(20), nullable=False)
    closing_reason = Column(String(100))

    offender = relationship("Offender")
    officer = relationship("Officer")

class Task(Base):
    __tablename__ = 'tasks'
    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    episode_id = Column(UUID(as_uuid=True), ForeignKey('supervision_episodes.episode_id'))
    created_by = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'))
    title = Column(String(100), nullable=False)
    description = Column(Text)
    due_date = Column(Date)
    status = Column(String(20), default='Pending')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    episode = relationship("SupervisionEpisode")
    creator = relationship("Officer")

class Facility(Base):
    __tablename__ = 'facilities'
    facility_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    phone = Column(String(20))
    services_offered = Column(Text)

class Residence(Base):
    __tablename__ = 'residences'
    residence_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    episode_id = Column(UUID(as_uuid=True), ForeignKey('supervision_episodes.episode_id'))
    facility_id = Column(UUID(as_uuid=True), ForeignKey('facilities.facility_id'), nullable=True)
    address_line_1 = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    zip_code = Column(String(10), nullable=False)
    is_current = Column(Boolean, default=False)
    
    episode = relationship("SupervisionEpisode", backref="residences")
    facility = relationship("Facility")
    contacts = relationship("ResidenceContact", backref="residence")

class ResidenceContact(Base):
    __tablename__ = 'residence_contacts'
    contact_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    residence_id = Column(UUID(as_uuid=True), ForeignKey('residences.residence_id'))
    name = Column(String(100), nullable=False)
    relation = Column(String(50))
    phone = Column(String(20))
    comments = Column(Text)

class Urinalysis(Base):
    __tablename__ = 'urinalysis'
    test_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'))
    date = Column(Date, nullable=False)
    test_type = Column(String(50)) # Random, Scheduled
    result = Column(String(50)) # Negative, Positive (Substance)
    lab_name = Column(String(100))
    collected_by_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'))
    notes = Column(Text)

    offender = relationship("Offender")
    collected_by = relationship("Officer")

class CaseNote(Base):
    __tablename__ = 'case_notes'
    note_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'))
    author_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'))
    date = Column(DateTime, default=datetime.utcnow)
    content = Column(Text, nullable=False)
    type = Column(String(50), default='General')
    is_pinned = Column(Boolean, default=False)

    offender = relationship("Offender")
    author = relationship("Officer")

class RiskAssessment(Base):
    __tablename__ = 'risk_assessments'
    assessment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'))
    date = Column(Date, nullable=False)
    total_score = Column(Integer)
    risk_level = Column(String(20)) # Low, Medium, High
    details = Column(JSON) # Store factor breakdown as JSON

    offender = relationship("Offender")

class Appointment(Base):
    __tablename__ = 'appointments'
    appointment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offender_id = Column(UUID(as_uuid=True), ForeignKey('offenders.offender_id'))
    officer_id = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'))
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
    value = Column(String(255), nullable=False)
    description = Column(Text)
