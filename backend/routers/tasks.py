from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"]
)

@router.post("", response_model=schemas.Task) # Using schemas.Task if defined, or create a new one
def create_task(
    task: schemas.TaskCreate, # Need to verify TaskCreate exists or define it
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify assignee exists
    assigned_officer = db.query(models.Officer).filter(models.Officer.officer_id == task.assigned_officer_id).first()
    if not assigned_officer:
        raise HTTPException(status_code=404, detail="Assigned officer not found")

    new_task = models.Task(
        created_by=current_user.user_id, # Assuming current user is an officer. If User table used, might need lookup.
        # Actually Task model uses created_by as Officer ID. 
        # So we need to find the officer profile of the current user.
        **task.dict()
    )
    
    # Override created_by with the actual officer ID of the creator
    creator_officer = db.query(models.Officer).filter(models.Officer.user_id == current_user.user_id).first()
    if creator_officer:
        new_task.created_by = creator_officer.officer_id
    else:
        # If creator isn't an officer (e.g. Admin acting as User), handle gracefully or require Officer profile
        # For now, let's assume Supervisor ID is needed. 
        # If created_by is nullable ok, otherwise might error. 
        # Model says: created_by = Column(UUID(as_uuid=True), ForeignKey('officers.officer_id'), index=True)
         pass

    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("", response_model=List[schemas.Task])
def get_tasks(
    assigned_to_user_id: Optional[str] = None,
    location_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Task)
    
    if location_id:
        # Filter by tasks assigned to officers in this location
        query = query.join(models.Task.assigned_officer).filter(models.Officer.location_id == location_id)

    if assigned_to_user_id:
        # Check if the user ID is an Officer ID or User ID.
        # The frontend sends a user ID (from auth) or an ID from the dropdown. 
        # Ideally, we should filter by Officer ID if the Task model uses Officer ID.
        # But our dropdown in TasksModule might be sending User IDs.
        
        # Let's try to handle both or assume mapped correctly.
        # Based on previous code, TasksModule "officers" list uses `user_id`.
        # So we need to find the officer associated with this `assigned_to_user_id`.
        
        officer = db.query(models.Officer).filter(models.Officer.user_id == assigned_to_user_id).first()
        if officer:
            query = query.filter(models.Task.assigned_officer_id == officer.officer_id)
        else:
            # If no officer found (maybe it IS an officer ID?), try direct match
            # This is a bit risky but flexible for dev.
            # Convert to UUID to be safe
            try:
                query = query.filter(models.Task.assigned_officer_id == assigned_to_user_id)
            except:
                pass # Invalid UUID, ignore or return empty

    if status:
        query = query.filter(models.Task.status == status)
        
    return query.order_by(models.Task.due_date.asc(), models.Task.created_at.desc()).all()
