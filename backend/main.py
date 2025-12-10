from fastapi import FastAPI, Request
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from . import models, database, auth
from .database import engine, get_db
from .routers import auth as auth_router, users, offenders, settings, dashboard, workflow, tasks, appointments, fees, assessments, automations, documents
from fastapi.staticfiles import StaticFiles

models.Base.metadata.create_all(bind=engine)

# Configure Structured Logging
from contextvars import ContextVar
import uuid

request_id_ref = ContextVar("request_id", default=None)

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
            "trace_id": request_id_ref.get()
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return import_json().dumps(log_record)

def import_json():
    import json
    return json

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())

logging.basicConfig(
    level=logging.INFO,
    handlers=[handler],
    force=True  # Ensure we override any existing config
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Parole Officer Dashboard API")

# Mount Media (Static Files)
import os
os.makedirs("backend/media", exist_ok=True)
app.mount("/media", StaticFiles(directory="backend/media"), name="media")

# Middleware for Request IDs
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request_id_ref.set(request_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow ALL for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    error_msg = str(exc)
    tb = traceback.format_exc()
    
    # Log to file
    with open("global_error.txt", "w") as f:
        f.write(f"Error: {error_msg}\n")
        f.write(tb)
        
    logger.error(f"Global Exception: {error_msg}\n{tb}")
    
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": error_msg, "traceback": tb},
    )

# Include Routers
app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(offenders.router)
app.include_router(settings.router)
app.include_router(dashboard.router)
app.include_router(workflow.router)
app.include_router(tasks.router)
app.include_router(appointments.router)
app.include_router(fees.router)
app.include_router(assessments.router)
app.include_router(automations.router)
app.include_router(documents.router)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

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
