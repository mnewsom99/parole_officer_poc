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
