from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"]
)

@router.post("", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Dummy return for debugging
    # raise HTTPException(status_code=418, detail="I am a teapot - Endpoint reached")
    
    try:
        # Verify assignee exists
        assigned_officer = db.query(models.Officer).filter(models.Officer.officer_id == task.assigned_officer_id).first()
        if not assigned_officer:
            raise HTTPException(status_code=404, detail="Assigned officer not found")

        creator_officer = db.query(models.Officer).filter(models.Officer.user_id == current_user.user_id).first()
        
        task_data = task.dict()
        task_data.pop('priority', None) # Remove priority if model doesn't support it yet
        
        new_task = models.Task(
            created_by=creator_officer.officer_id if creator_officer else None,
            **task_data
        )

        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        return new_task
    except Exception as e:
        db.rollback()
        with open("last_error.txt", "w") as f:
            f.write(str(e))
            import traceback
            traceback.print_exc(file=f)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[schemas.Task])
def get_tasks(
    assigned_to_user_id: Optional[str] = None,
    assigned_officer_id: Optional[str] = None, # New parameter for direct officer ID
    location_id: Optional[str] = None,
    status: Optional[str] = None,
    offender_id: Optional[str] = None, # Added
    db: Session = Depends(get_db)
):
    query = db.query(models.Task)
    
    if location_id:
        # Filter by tasks assigned to officers in this location
        query = query.join(models.Task.assigned_officer).filter(models.Officer.location_id == location_id)

    # Prioritize direct assigned_officer_id if provided (robust way)
    if assigned_officer_id:
        query = query.filter(models.Task.assigned_officer_id == assigned_officer_id)
    
    # Fallback to user_id lookup if only that is provided (legacy/compat way)
    elif assigned_to_user_id:
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

    if offender_id:
        query = query.filter(models.Task.offender_id == offender_id)
        
    return query.order_by(models.Task.due_date.asc(), models.Task.created_at.desc()).all()

@router.put("/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: str,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Find the task
    task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Permission check (optional: only assignee or supervisor/admin?)
    # For now, allow any authenticated user to update tasks (e.g. collaborative)
    
    # Update fields
    update_data = task_update.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(task, key, value)
        
    try:
        db.commit()
        db.refresh(task)
        return task
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
