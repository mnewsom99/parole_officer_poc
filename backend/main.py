from fastapi import FastAPI, Depends, HTTPException, Query, status
import logging
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from uuid import UUID
import random
from datetime import datetime, timedelta
import calendar
from datetime import datetime, timedelta

from . import models, database, schemas, auth
from .database import engine, get_db
from fastapi.security import OAuth2PasswordRequestForm

models.Base.metadata.create_all(bind=engine)

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)


app = FastAPI(title="Parole Officer Dashboard API")

# Seed Roles and Default User on startup
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    # Seed Roles
    roles = ["Admin", "Manager", "Supervisor", "Officer"]
    for role_name in roles:
        role = db.query(models.Role).filter(models.Role.role_name == role_name).first()
        if not role:
            new_role = models.Role(role_name=role_name)
            db.add(new_role)
    db.commit()

    # Seed Default Admin User
    admin_role = db.query(models.Role).filter(models.Role.role_name == "Admin").first()
    if admin_role:
        existing_admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not existing_admin:
            from . import auth
            hashed_pwd = auth.get_password_hash("admin123")
            new_admin = models.User(
                username="admin",
                email="admin@system.local",
                password_hash=hashed_pwd,
                role_id=admin_role.role_id
            )
            db.add(new_admin)
            db.commit()
        else:
            from . import auth
            hashed_pwd = auth.get_password_hash("admin123")
            existing_admin.password_hash = hashed_pwd
            db.add(existing_admin)
            db.commit()

    # Ensure locations exist for officers
    location = db.query(models.Location).first()
    if not location:
        location = models.Location(name="Main Station", address="123 Main St", type="HQ")
        db.add(location)
        db.commit()
        db.refresh(location)
    
    # Ensure Admin has an Officer Profile
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    if admin_user:
        admin_officer = db.query(models.Officer).filter(models.Officer.user_id == admin_user.user_id).first()
        if not admin_officer:
            new_officer = models.Officer(
                user_id=admin_user.user_id,
                location_id=location.location_id,
                badge_number="ADMIN",
                first_name="Mike",
                last_name="N",
                phone_number=""
            )
            db.add(new_officer)
            db.commit()

    # Seed Other Roles with Officer Profiles
    roles_to_seed = ["Manager", "Supervisor", "Officer"]
    for r_name in roles_to_seed:
        role_obj = db.query(models.Role).filter(models.Role.role_name == r_name).first()
        if role_obj:
            username = r_name.lower()
            existing_user = db.query(models.User).filter(models.User.username == username).first()
            
            # Ensure consistent hashing
            from . import auth
            target_hash = auth.get_password_hash("hash123")
            
            if not existing_user:
                new_user = models.User(
                    username=username,
                    email=f"{username}@system.local",
                    password_hash=target_hash,
                    role_id=role_obj.role_id
                )
                db.add(new_user)
                db.flush() # Get user_id

                # Create associated Officer profile
                new_officer = models.Officer(
                    user_id=new_user.user_id,
                    location_id=location.location_id,
                    badge_number=f"BADGE-{username.upper()}",
                    first_name=r_name,
                    last_name="User",
                    phone_number="555-0000"
                )
                db.add(new_officer)
                db.commit()
            else:
                # Update password for existing users to ensure matching hash if needed
                if existing_user.password_hash != target_hash:
                     existing_user.password_hash = target_hash
                     db.add(existing_user)
                     db.commit()


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow ALL for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Parole Officer Dashboard API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    logger.info(f"Login attempt for user: '{form_data.username}'")
    # DEBUG: Print DB URL
    from .database import SQLALCHEMY_DATABASE_URL
    print(f"DEBUG: Active DB URL: {SQLALCHEMY_DATABASE_URL}")
    
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user:
        logger.warning(f"Login failed: User '{form_data.username}' not found.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # DEBUG: Print Hash comparison
    print(f"DEBUG: User found: {user.username}")
    print(f"DEBUG: Stored Hash: {user.password_hash}")
    verification = auth.verify_password(form_data.password, user.password_hash)
    print(f"DEBUG: Verify Result for '{form_data.password}': {verification}")

    if not verification:
        logger.warning(f"Login failed: Invalid password for user '{form_data.username}'.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    logger.info(f"User '{form_data.username}' logged in successfully.")
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user



@app.get("/roles", response_model=List[schemas.Role])
def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

@app.get("/users", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db)):
    # Include role and officer relationship if defined in schema, 
    # but Officer isn't on User model backref by default unless we add it.
    # We added 'user' to Officer, so we can access user.officer if backref exists.
    # Ideally, we should add backref to User model in models.py or just query separately.
    # For now, let's just return users. Frontend can match matching officers if needed,
    # OR we relying on 'joinedload' if the relationship exists.
    # Check models.py: Officer has 'user = relationship("User")'. User has NO backref.
    # Let's rely on frontend fetching Current User -> Officer details via separate call if needed,
    # OR update User model. 
    # Actually, simpler: let's just return Users. Authentication context usually provides this.
    return db.query(models.User).options(joinedload(models.User.role)).all()

@app.get("/users/{user_id}/officer", response_model=Optional[schemas.Officer])
def get_officer_by_user(user_id: UUID, db: Session = Depends(get_db)):
    officer = db.query(models.Officer).options(
        joinedload(models.Officer.location),
        joinedload(models.Officer.supervisor)
    ).filter(models.Officer.user_id == user_id).first()
    return officer

@app.put("/users/{user_id}/role", response_model=schemas.User)
def update_user_role(user_id: UUID, role_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if role_update.role_id:
        user.role_id = role_update.role_id
    db.commit()
    db.refresh(user)
    return user

@app.put("/users/{user_id}/status", response_model=schemas.User)
def update_user_status(user_id: UUID, status_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if status_update.is_active is not None:
        user.is_active = status_update.is_active
    
    db.commit()
    db.refresh(user)
    return user

@app.post("/users/create", response_model=schemas.User)
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check username/email uniqueness
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    from . import auth
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



@app.get("/officers", response_model=List[schemas.Officer])
def get_officers(location_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    query = db.query(models.Officer).options(joinedload(models.Officer.location))
    if location_id:
        query = query.filter(models.Officer.location_id == location_id)
    officers = query.all()
    return officers

    officers = query.all()
    return officers

@app.put("/officers/{officer_id}", response_model=schemas.Officer)
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
        
    # Update associated User email if provided
    if officer_update.email and officer.user_id:
        user = db.query(models.User).filter(models.User.user_id == officer.user_id).first()
        if user:
            user.email = officer_update.email
            db.add(user) # Ensure user update is tracked
            
    db.commit()
    db.refresh(officer)
    return officer

@app.get("/offenders") # Returning custom dict to match frontend for now
def get_offenders(officer_id: Optional[UUID] = None, location_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    query = db.query(models.SupervisionEpisode).options(
        joinedload(models.SupervisionEpisode.offender),
        joinedload(models.SupervisionEpisode.residences).options(
            joinedload(models.Residence.special_assignment),
            joinedload(models.Residence.contacts)
        )
    )
    
    if officer_id:
        query = query.filter(models.SupervisionEpisode.assigned_officer_id == officer_id)
    elif location_id:
        query = query.join(models.Officer).filter(models.Officer.location_id == location_id)
        
    episodes = query.all()
    
    # Transform to match frontend expectation
    results = []
    for ep in episodes:
        offender = ep.offender
        if not offender:
            continue
            
        # Get current residence
        current_residence = next((r for r in ep.residences if r.is_current), None)
        
        address_str = "No Address"
        housing_type = "Unknown"
        facility_info = None
        contacts = []

        if current_residence:
            if current_residence.special_assignment and current_residence.special_assignment.type == 'Facility':
                housing_type = "Facility"
                sa = current_residence.special_assignment
                address_str = f"{sa.name} - {sa.address}"
                facility_info = {
                    "name": sa.name,
                    "address": sa.address,
                    "phone": "N/A", # Facility phone not in special_assignment table yet
                    "services": "Standard" # Placeholder
                }
            else:
                housing_type = "Private"
                address_str = f"{current_residence.address_line_1}, {current_residence.city}, {current_residence.state} {current_residence.zip_code}"
                contacts = [
                    {
                        "name": c.name,
                        "relation": c.relation,
                        "phone": c.phone,
                        "comments": c.comments
                    } for c in current_residence.contacts
                ]
        
        results.append({
            "id": str(offender.offender_id),
            "name": f"{offender.last_name}, {offender.first_name}",
            "badgeId": offender.badge_id,
            "risk": ep.risk_level_at_start, # Using start risk as current
            "status": ep.status,
            "nextCheck": "2025-12-10T10:00:00", # Mock next check
            "compliance": random.randint(60, 100), # Mock compliance
            "image": offender.image_url or f"https://ui-avatars.com/api/?name={offender.first_name}+{offender.last_name}&background=random",
            "address": address_str,
            "city": current_residence.city if current_residence else "",
            "state": current_residence.state if current_residence else "",
            "zip": current_residence.zip_code if current_residence else "",
            "phone": "555-0199", # Mock phone
            "housingType": housing_type,
            "facility": facility_info,
            "residenceContacts": contacts,
            "gender": offender.gender,
            "isSexOffender": offender.is_sex_offender,
            "isGangMember": offender.is_gang_member,
            "gangAffiliation": offender.gang_affiliation,
            "releaseDate": offender.release_date,
            "reversionDate": offender.reversion_date,
            "releaseType": offender.release_type,
            "initialPlacement": offender.initial_placement,
            "generalComments": offender.general_comments
        })
        
    return results

@app.get("/offenders/{offender_id}")
def get_offender_details(offender_id: UUID, db: Session = Depends(get_db)):
    episode = db.query(models.SupervisionEpisode).options(
        joinedload(models.SupervisionEpisode.offender),
        joinedload(models.SupervisionEpisode.residences).options(
            joinedload(models.Residence.special_assignment),
            joinedload(models.Residence.contacts)
        )
    ).filter(models.SupervisionEpisode.offender_id == offender_id, models.SupervisionEpisode.status == "Active").first()

    if not episode:
        raise HTTPException(status_code=404, detail="Offender not found or not active")

    offender = episode.offender
    
    # Get current residence
    current_residence = next((r for r in episode.residences if r.is_current), None)
    
    address_str = "No Address"
    housing_type = "Unknown"
    facility_info = None
    contacts = []

    if current_residence:
        if current_residence.special_assignment:
            housing_type = "Facility"
            sa = current_residence.special_assignment
            address_str = f"{sa.name} - {sa.address}"
            facility_info = {
                "name": sa.name,
                "address": sa.address,
                "phone": "N/A", # Facility phone not in special_assignment table yet
                "services": "Standard" # Placeholder
            }
        else:
            housing_type = "Private"
            address_str = f"{current_residence.address_line_1}, {current_residence.city}, {current_residence.state} {current_residence.zip_code}"
            contacts = [
                {
                    "name": c.name,
                    "relation": c.relation,
                    "phone": c.phone,
                    "comments": c.comments
                } for c in current_residence.contacts
            ]

    return {
        "id": str(offender.offender_id),
        "name": f"{offender.last_name}, {offender.first_name}",
        "badgeId": offender.badge_id,
        "risk": episode.risk_level_at_start,
        "status": episode.status,
        "nextCheck": "2025-12-10T10:00:00", # Mock
        "compliance": random.randint(60, 100), # Mock
        "image": offender.image_url or f"https://ui-avatars.com/api/?name={offender.first_name}+{offender.last_name}&background=random",
        "address": address_str,
        "city": current_residence.city if current_residence else "",
        "state": current_residence.state if current_residence else "",
        "zip": current_residence.zip_code if current_residence else "",
        "phone": "555-0199", # Mock
        "housingType": housing_type,
        "facility": facility_info,
        "residenceContacts": contacts,
        "gender": offender.gender,
        "isSexOffender": offender.is_sex_offender,
        "isGangMember": offender.is_gang_member,
        "gangAffiliation": offender.gang_affiliation,
        "releaseDate": offender.release_date,
        "reversionDate": offender.reversion_date,
        "releaseType": offender.release_type,
        "initialPlacement": offender.initial_placement,
        "generalComments": offender.general_comments
    }

@app.post("/offenders", response_model=schemas.Offender)
def create_offender(offender: schemas.OffenderCreate, db: Session = Depends(get_db)):
    # 1. Create Offender
    new_offender = models.Offender(
        badge_id=offender.badge_id,
        first_name=offender.first_name,
        last_name=offender.last_name,
        dob=offender.dob,
        image_url=offender.image_url
    )
    db.add(new_offender)
    db.flush() # Flush to get offender_id
    
    # 2. Create Supervision Episode
    new_episode = models.SupervisionEpisode(
        offender_id=new_offender.offender_id,
        assigned_officer_id=offender.assigned_officer_id,
        start_date=offender.start_date,
        end_date=offender.end_date,
        status="Active",
        risk_level_at_start=offender.risk_level
    )
    db.add(new_episode)
    db.flush() # Flush to get episode_id
    
    # 3. Create Residence
    new_residence = models.Residence(
        episode_id=new_episode.episode_id,
        address_line_1=offender.address_line_1,
        city=offender.city,
        state=offender.state,
        zip_code=offender.zip_code,
        is_current=True
    )
    db.add(new_residence)
    
    db.commit()
    db.refresh(new_offender)
    db.commit()
    db.commit()
    db.refresh(new_offender)
    
    # 4. Assign Onboarding Tasks
    from . import tasks
    tasks.assign_onboarding_tasks(new_episode.episode_id, db)
    
    return new_offender

@app.get("/offenders/{offender_id}/urinalysis", response_model=List[schemas.Urinalysis])
def get_urinalysis(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Urinalysis).filter(models.Urinalysis.offender_id == offender_id).options(joinedload(models.Urinalysis.collected_by)).order_by(models.Urinalysis.date.desc()).all()

@app.get("/offenders/{offender_id}/notes", response_model=List[schemas.CaseNote])
def get_case_notes(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.CaseNote).filter(models.CaseNote.offender_id == offender_id).options(joinedload(models.CaseNote.author)).order_by(models.CaseNote.is_pinned.desc(), models.CaseNote.date.desc()).all()

@app.get("/offenders/{offender_id}/risk", response_model=List[schemas.RiskAssessment])
def get_risk_assessments(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.RiskAssessment).filter(models.RiskAssessment.offender_id == offender_id).order_by(models.RiskAssessment.date.desc()).all()

@app.get("/offenders/{offender_id}/appointments", response_model=List[schemas.Appointment])
def get_appointments(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Appointment).filter(models.Appointment.offender_id == offender_id).options(joinedload(models.Appointment.officer)).order_by(models.Appointment.date_time.asc()).all()

@app.get("/offenders/{offender_id}/programs", response_model=List[schemas.Program])
def get_programs(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Program).filter(models.Program.offender_id == offender_id).order_by(models.Program.start_date.desc()).all()

@app.post("/offenders/{offender_id}/notes", response_model=schemas.CaseNote)
def create_case_note(offender_id: UUID, note: schemas.CaseNoteBase, db: Session = Depends(get_db)):
    # Mock author for now (first officer found)
    author = db.query(models.Officer).first()
    new_note = models.CaseNote(
        offender_id=offender_id,
        author_id=author.officer_id,
        content=note.content,
        type=note.type,
        date=datetime.utcnow()
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@app.put("/notes/{note_id}/pin", response_model=schemas.CaseNote)
def toggle_pin_note(note_id: UUID, db: Session = Depends(get_db)):
    note = db.query(models.CaseNote).filter(models.CaseNote.note_id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note.is_pinned = not note.is_pinned
    db.commit()
    db.refresh(note)
    return note

@app.get("/settings/note-types", response_model=List[schemas.NoteTypeConfig])
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
    import json
    data = json.loads(setting.value)
    # Handle legacy simple string list if exists
    if data and isinstance(data[0], str):
         return [{"name": t, "color": "bg-slate-100 text-slate-700"} for t in data]
    return data

@app.put("/settings/note-types", response_model=List[schemas.NoteTypeConfig])
def update_note_types(update: schemas.NoteTypeUpdate, db: Session = Depends(get_db)):
    import json
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

@app.get("/settings/appointment-types", response_model=List[schemas.AppointmentTypeConfig])
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
    import json
    data = json.loads(setting.value)
    return data

@app.put("/settings/appointment-types", response_model=List[schemas.AppointmentTypeConfig])
def update_appointment_types(update: schemas.AppointmentTypeUpdate, db: Session = Depends(get_db)):
    import json
    types_data = [t.dict() for t in update.types]
    
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == "appointment_types").first()
    if not setting:
        setting = models.SystemSettings(key="appointment_types", value=json.dumps(types_data))
        db.add(setting)
    else:
        setting.value = json.dumps(types_data)
    
    db.commit()
    return update.types

@app.get("/settings/appointment-locations", response_model=List[schemas.AppointmentLocationConfig])
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
    import json
    data = json.loads(setting.value)
    return data

@app.put("/settings/appointment-locations", response_model=List[schemas.AppointmentLocationConfig])
def update_appointment_locations(update: schemas.AppointmentLocationUpdate, db: Session = Depends(get_db)):
    import json
    locs_data = [t.dict() for t in update.locations]
    
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == "appointment_locations").first()
    if not setting:
        setting = models.SystemSettings(key="appointment_locations", value=json.dumps(locs_data))
        db.add(setting)
    else:
        setting.value = json.dumps(locs_data)
    
    db.commit()
    return update.locations

@app.post("/offenders/{offender_id}/appointments", response_model=schemas.Appointment)
def create_appointment(offender_id: UUID, appt: schemas.AppointmentBase, db: Session = Depends(get_db)):
    # Mock officer for now
    officer = db.query(models.Officer).first()
    new_appt = models.Appointment(
        offender_id=offender_id,
        officer_id=officer.officer_id,
        date_time=appt.date_time,
        location=appt.location,
        type=appt.type,
        status="Scheduled",
        notes=appt.notes
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    return new_appt

@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Get Current Officer ID associated with the user
    officer = db.query(models.Officer).filter(models.Officer.user_id == current_user.user_id).first()
    officer_id = officer.officer_id if officer else None

    # 2. Total Caseload (Active Episodes)
    query = db.query(models.SupervisionEpisode).filter(models.SupervisionEpisode.status == 'Active')
    if officer_id:
        query = query.filter(models.SupervisionEpisode.assigned_officer_id == officer_id)
    
    total_caseload = query.count()
    active_offenders = total_caseload

    # 3. Warrants Issued (Active/Pinned Violations)
    warrants_query = db.query(models.CaseNote).filter(
        models.CaseNote.type == 'Violation',
        models.CaseNote.is_pinned == True
    )
    if officer_id:
        warrants_query = warrants_query.join(models.Offender).join(models.SupervisionEpisode).filter(
            models.SupervisionEpisode.status == 'Active',
            models.SupervisionEpisode.assigned_officer_id == officer_id
        )
    
    warrants_issued = warrants_query.count()

    # 4. Compliance Rate
    if total_caseload > 0:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        violators_query = db.query(models.CaseNote.offender_id).filter(
            models.CaseNote.type == 'Violation',
            models.CaseNote.date >= thirty_days_ago
        )
        if officer_id:
           violators_query = violators_query.join(models.Offender).join(models.SupervisionEpisode).filter(
                models.SupervisionEpisode.status == 'Active',
                models.SupervisionEpisode.assigned_officer_id == officer_id
            )
        
        violator_count = violators_query.distinct().count()
        compliant_count = total_caseload - violator_count
        compliance_rate = round((compliant_count / total_caseload) * 100, 1)
    else:
        compliance_rate = 100.0

    # 5. Pending Reviews
    pending_query = db.query(models.Task).filter(models.Task.status == 'Pending')
    if officer_id:
        pending_query = pending_query.join(models.SupervisionEpisode).filter(
            models.SupervisionEpisode.assigned_officer_id == officer_id
        )
    pending_reviews = pending_query.count()

    # 6. Risk Distribution
    # Count Active Episodes by Risk Level
    risk_query = db.query(
        models.SupervisionEpisode.risk_level_at_start,
        func.count(models.SupervisionEpisode.risk_level_at_start)
    ).filter(models.SupervisionEpisode.status == 'Active')

    if officer_id:
        risk_query = risk_query.filter(models.SupervisionEpisode.assigned_officer_id == officer_id)
    
    risk_counts = risk_query.group_by(models.SupervisionEpisode.risk_level_at_start).all()
    
    # Format for frontend
    # Ensure all levels present
    levels = {
        "Low": {"value": 0, "color": "#22c55e"},   # Green-500
        "Medium": {"value": 0, "color": "#eab308"}, # Yellow-500
        "High": {"value": 0, "color": "#ef4444"}    # Red-500
    }

    for risk_level, count in risk_counts:
        rs = risk_level.capitalize() if risk_level else "Unknown"
        if rs in levels:
            levels[rs]["value"] = count
    
    risk_distribution = [
        schemas.RiskDistributionItem(name=k, value=v["value"], color=v["color"])
        for k, v in levels.items()
    ]

    return schemas.DashboardStats(
        total_caseload=total_caseload,
        active_offenders=active_offenders,
        compliance_rate=compliance_rate,
        pending_reviews=pending_reviews,
        warrants_issued=warrants_issued,
        risk_distribution=risk_distribution
    )

# --- Territory Management Endpoints ---

@app.get("/territories", response_model=List[schemas.Territory])
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

@app.post("/territories", response_model=schemas.Territory)
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

@app.delete("/territories/{zip_code}")
def delete_territory(zip_code: str, db: Session = Depends(get_db)):
    db_territory = db.query(models.Territory).filter(models.Territory.zip_code == zip_code).first()
    if not db_territory:
        raise HTTPException(status_code=404, detail="Territory not found")
    
    db.delete(db_territory)
    db.commit()
    return {"message": "Territory deleted"}

@app.get("/special-assignments", response_model=List[schemas.SpecialAssignment])
def get_special_assignments(db: Session = Depends(get_db)):
    return db.query(models.SpecialAssignment).order_by(models.SpecialAssignment.priority).all()

@app.post("/special-assignments", response_model=schemas.SpecialAssignment)
def create_special_assignment(assignment: schemas.SpecialAssignmentCreate, db: Session = Depends(get_db)):
    new_assignment = models.SpecialAssignment(**assignment.dict())
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

@app.put("/special-assignments/{assignment_id}", response_model=schemas.SpecialAssignment)
def update_special_assignment(assignment_id: UUID, update: schemas.SpecialAssignmentUpdate, db: Session = Depends(get_db)):
    db_assignment = db.query(models.SpecialAssignment).filter(models.SpecialAssignment.assignment_id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    for key, value in update.dict(exclude_unset=True).items():
        setattr(db_assignment, key, value)
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@app.delete("/special-assignments/{assignment_id}")
def delete_special_assignment(assignment_id: UUID, db: Session = Depends(get_db)):
    db_assignment = db.query(models.SpecialAssignment).filter(models.SpecialAssignment.assignment_id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(db_assignment)
    db.commit()
    return {"message": "Assignment deleted"}

from fastapi.responses import StreamingResponse
from . import reports

@app.get("/reports/monthly-summary/{month}")
def get_monthly_report(month: str):
    """
    Generates and returns a PDF report for the specified month.
    """
    pdf_buffer = reports.generate_monthly_report(month)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{month}.pdf"}
    )

@app.get("/locations", response_model=List[schemas.Location])
def get_locations(db: Session = Depends(get_db)):
    return db.query(models.Location).all()
