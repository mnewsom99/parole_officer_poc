import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
from backend.database import get_db
from backend.models import Base
from backend import models

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """
    Creates a fresh database for each test function.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """
    FastAPI TestClient with overridden database dependency.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

from datetime import date

@pytest.fixture(scope="function")
def test_offender(db_session):
    """
    Seeds a test offender, supervision episode, and residence for use in tests.
    """
    # 1. Offender
    offender = models.Offender(
        first_name="Test",
        last_name="Subject",
        badge_id="TST-001",
        dob=date(1990, 1, 1),
        gender="Male"
    )
    db_session.add(offender)
    db_session.flush()

    # 2. Supervision Episode
    episode = models.SupervisionEpisode(
        offender_id=offender.offender_id,
        # assigned_officer_id=... (Optional or create an officer first)
        start_date=date(2023, 1, 1),
        status="Active",
        risk_level_at_start="Medium"
    )
    db_session.add(episode)
    db_session.flush()

    # 3. Residence
    residence = models.Residence(
        episode_id=episode.episode_id,
        address_line_1="123 Test St",
        city="Phoenix",
        state="AZ",
        zip_code="85001",
        is_current=True
    )
    db_session.add(residence)

    db_session.commit()
    db_session.refresh(offender)
    return offender
