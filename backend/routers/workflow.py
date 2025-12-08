from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid
from datetime import datetime

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/workflows",
    tags=["Workflows"]
)

# --- Templates ---

@router.post("/templates", response_model=schemas.FormTemplate)
def create_template(template: schemas.FormTemplateCreate, db: Session = Depends(get_db)):
    db_template = models.FormTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/templates", response_model=List[schemas.FormTemplate])
def get_templates(db: Session = Depends(get_db)):
    return db.query(models.FormTemplate).all()

# --- Submissions (Tasks) ---

@router.post("/submissions", response_model=schemas.FormSubmission)
def create_submission(
    submission: schemas.FormSubmissionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Setup default values
    new_submission = models.FormSubmission(
        template_id=submission.template_id,
        offender_id=submission.offender_id,
        assigned_to_user_id=submission.assigned_to_user_id or current_user.user_id, # Default to self if not specified
        created_by_id=current_user.user_id,
        form_data=submission.form_data,
        status="Draft",
        current_step="Draft"
    )
    
    # Auto-fill logic could go here (fetching offender data and merging into form_data)
    
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)
    return new_submission

@router.get("/tasks/me", response_model=List[schemas.FormSubmission])
def get_my_tasks(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.FormSubmission).filter(
        models.FormSubmission.assigned_to_user_id == current_user.user_id
    ).order_by(models.FormSubmission.updated_at.desc()).all()

@router.get("/tasks", response_model=List[schemas.FormSubmission])
def get_tasks(
    assigned_to_user_id: Optional[str] = None,
    location_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.FormSubmission)

    # Filter by specific user if provided
    if assigned_to_user_id:
        query = query.filter(models.FormSubmission.assigned_to_user_id == assigned_to_user_id)
    # If no user but location provided, filter by all users in that location
    elif location_id:
        # Subquery or join to find users in this location
        # Get all officer user_ids in this location
        officers_in_loc = db.query(models.Officer.user_id).filter(models.Officer.location_id == location_id).subquery()
        query = query.filter(models.FormSubmission.assigned_to_user_id.in_(officers_in_loc))
    
    # Filter by Status
    if status:
        query = query.filter(models.FormSubmission.status == status)

    return query.order_by(models.FormSubmission.updated_at.desc()).all()

@router.get("/submissions/{submission_id}", response_model=schemas.FormSubmission)
def get_submission(submission_id: uuid.UUID, db: Session = Depends(get_db)):
    submission = db.query(models.FormSubmission).filter(models.FormSubmission.submission_id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission

# --- Workflow Core Logic ---

@router.put("/submissions/{submission_id}/action", response_model=schemas.FormSubmission)
def perform_workflow_action(
    submission_id: uuid.UUID,
    action_payload: schemas.WorkflowAction,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    submission = db.query(models.FormSubmission).filter(models.FormSubmission.submission_id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Log the action (Audit Trail)
    log = models.WorkflowLog(
        submission_id=submission.submission_id,
        actor_id=current_user.user_id,
        action=action_payload.action,
        comment=action_payload.comment
    )
    db.add(log)

    # --- Transfer Request Specific Logic ---
    # In a real system, this would be a config based state machine.
    # Here we hardcode for the POC based on Template Name.
    
    template = db.query(models.FormTemplate).filter(models.FormTemplate.template_id == submission.template_id).first()
    is_transfer = template and "Transfer" in template.name

    if is_transfer:
        handle_transfer_logic(submission, action_payload, current_user, db)
    else:
        # Generic Logic
        if action_payload.action == "Submit":
            submission.status = "Submitted"
            submission.is_locked = True
        elif action_payload.action == "Return":
             submission.status = "Returned"
             submission.is_locked = False
             # Re-assign to creator?
             submission.assigned_to_user_id = submission.created_by_id
        elif action_payload.action == "Approve":
            submission.status = "Approved"
        elif action_payload.action == "Deny":
            submission.status = "Denied"
    
    # Handle explicit re-assignment if passed (overrides logic above if strict)
    if action_payload.target_user_id:
        submission.assigned_to_user_id = action_payload.target_user_id

    submission.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(submission)
    return submission

def handle_transfer_logic(submission: models.FormSubmission, payload: schemas.WorkflowAction, actor: models.User, db: Session):
    action = payload.action
    current_status = submission.status

    # Get Actor's Officer profile to find Supervisor
    actor_officer = db.query(models.Officer).filter(models.Officer.user_id == actor.user_id).first()

    if action == "Submit" and (current_status == "Draft" or current_status == "Correction_Needed"):
        submission.status = "Pending_Sup_Review"
        submission.is_locked = True
        submission.current_step = "Supervisor Review"
        
        # Assign to Supervisor
        if actor_officer and actor_officer.supervisor_id:
            # supervisor_id is an Officer ID, we need User ID
            sup_officer = db.query(models.Officer).filter(models.Officer.officer_id == actor_officer.supervisor_id).first()
            if sup_officer and sup_officer.user_id:
                submission.assigned_to_user_id = sup_officer.user_id
            else:
                 # Fallback or Error? For POC keep as is or assign to Admin
                 pass
        else:
            # If no supervisor, maybe remains assigned to self or goes to a default queue?
            pass

    elif action == "Return":
        submission.status = "Correction_Needed"
        submission.is_locked = False
        submission.current_step = "Draft"
        # Assign back to creator
        submission.assigned_to_user_id = submission.created_by_id

    elif action == "Approve" and current_status == "Pending_Sup_Review":
        # Supervisor Approved. 
        # Requirement: "Assigned to a specific target Supervisor (passed in args)"
        submission.status = "Pending_Receiving_Sup"
        submission.current_step = "Receiving Supervisor Review"
        # assignment handled by generic check for target_user_id in main function
    
    elif action == "Approve" and current_status == "Pending_Receiving_Sup":
        # Receiving Supervisor Approved
        # Requirement: "Assigned to new Officer" (passed in args)
        submission.status = "Pending_New_Officer"
        submission.current_step = "New Officer Acceptance"
        # assignment handled by generic check for target_user_id
    
    elif action == "Accept" and current_status == "Pending_New_Officer":
        # New Officer Accepts
        submission.status = "Completed"
        submission.current_step = "Completed"
        
        # SIDE EFFECT: Update Database
        if submission.offender_id:
            # 1. Update Supervision Episode if exists or Create new? 
            # Usually we close old episode and open new one, or just update current active one.
            # Let's update the active episode.
            episode = db.query(models.SupervisionEpisode).filter(
                models.SupervisionEpisode.offender_id == submission.offender_id,
                models.SupervisionEpisode.status == 'Active'
            ).first()

            # The actor (New Officer) is the one accepting, so they become the assigned officer.
            # We need their Officer ID.
            new_officer = db.query(models.Officer).filter(models.Officer.user_id == actor.user_id).first()
            
            if episode and new_officer:
                episode.assigned_officer_id = new_officer.officer_id
                
                # Update location? If officer has location, maybe update episode/offender location context?
                # SupervisionEpisode doesn't store location, but Officer does. 
                # So by changing officer, we effectively change the location of supervision.
                # If Offender table had location, we'd update it too. (It doesn't seem to, reliance is on Episode -> Officer -> Location)
                pass 
                
    elif action == "Deny":
         submission.status = "Denied"
         submission.is_locked = True
         # End workflow
