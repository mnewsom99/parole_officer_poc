from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import shutil
import os
import uuid
from datetime import datetime

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

MEDIA_ROOT = "backend/media"

# Ensure media directory exists
os.makedirs(MEDIA_ROOT, exist_ok=True)

@router.post("/upload", response_model=schemas.Document)
async def upload_document(
    file: UploadFile = File(...),
    offender_id: UUID = Form(...),
    uploaded_by_id: UUID = Form(...),
    note_id: Optional[UUID] = Form(None),
    task_id: Optional[UUID] = Form(None),
    category: str = Form("General"),
    db: Session = Depends(get_db)
):
    # 1. Save File to Disk
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(MEDIA_ROOT, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 2. Create DB Record
    new_doc = models.Document(
        offender_id=offender_id,
        uploaded_by_id=uploaded_by_id,
        note_id=note_id,
        task_id=task_id,
        file_name=file.filename,
        file_path=file_path,  # Store relative or absolute path? Relative is better for portability if behind a static mount.
        file_type=file.content_type,
        category=category,
        uploaded_at=datetime.utcnow()
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return new_doc

@router.get("/offender/{offender_id}", response_model=List[schemas.Document])
def get_offender_documents(offender_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Document).filter(models.Document.offender_id == offender_id).order_by(models.Document.uploaded_at.desc()).all()

@router.delete("/{document_id}")
def delete_document(document_id: UUID, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete file from disk
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
        
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
