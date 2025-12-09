from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from .. import database, models
from ..services import risk_assessment_service

router = APIRouter(
    prefix="/assessments",
    tags=["Risk Assessments"]
)

@router.get("/init")
def initialize_assessment_form(offender_id: str, assessment_type: str, db: Session = Depends(database.get_db)):
    """
    Returns the question schema with pre-filled values based on the 'Look-Back' logic.
    """
    try:
        schema = risk_assessment_service.initialize_assessment(db, offender_id, assessment_type)
        return schema
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_assessment_session(
    offender_id: UUID, 
    assessment_type: str, 
    date: date, 
    db: Session = Depends(database.get_db)
):
    """
    Creates a new Assessment Session (Header).
    """
    new_assessment = models.RiskAssessment(
        offender_id=offender_id, # SQLAlchemy expects UUID object
        assessment_type=assessment_type,
        date=date,
        status='Draft'
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    return new_assessment

@router.post("/{assessment_id}/answers")
def save_answer(
    assessment_id: UUID, 
    tag: str, 
    value: str | int | bool | None, # Flexible body 
    db: Session = Depends(database.get_db)
):
    """
    Saves a single answer. Value is passed as a query or body param.
    For simplicity in this POC, we'll accept it via a simple Pydantic model in a real app,
    but here we'll just take it as a body dict or similar. 
    """
    pass # Defined properly below

from pydantic import BaseModel
from typing import Any

class AnswerRequest(BaseModel):
    tag: str
    value: Any

@router.post("/{assessment_id}/save")
def save_assessment_answer(
    assessment_id: UUID, 
    answer: AnswerRequest,
    db: Session = Depends(database.get_db)
):
    risk_assessment_service.save_assessment_answer(db, assessment_id, answer.tag, answer.value)
    return {"status": "success"}

class SubmitRequest(BaseModel):
    final_risk_level: str | None = None
    override_reason: str | None = None

@router.get("/{assessment_id}/calculate")
def calculate_score(assessment_id: UUID, db: Session = Depends(database.get_db)):
    """
    Returns the projected score and risk level without finalizing.
    """
    try:
        return risk_assessment_service.calculate_score(db, assessment_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{assessment_id}/submit")
def submit_assessment(
    assessment_id: UUID, 
    request: SubmitRequest = SubmitRequest(), 
    db: Session = Depends(database.get_db)
):
    """
    Finalizes the assessment, calculates score, applies override (if any), and updates status.
    """
    try:
        updated_assessment = risk_assessment_service.submit_assessment(
            db, 
            assessment_id, 
            final_risk_level=request.final_risk_level,
            override_reason=request.override_reason
        )
        return {
            "status": "completed",
            "total_score": updated_assessment.total_score,
            "risk_level": updated_assessment.risk_level,
            "final_risk_level": updated_assessment.final_risk_level
        }
    except ValueError as e:
         raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

# --- ADMIN ENDPOINTS ---

@router.get("/questions")
def list_questions(db: Session = Depends(database.get_db)):
    return risk_assessment_service.get_all_questions(db)

class QuestionUpdate(BaseModel):
    question_text: str | None = None
    category: str | None = None
    input_type: str | None = None
    scoring_note: str | None = None
    assessments_list: str | None = None
    options: list[dict] | None = None
    # Add other fields as needed

@router.put("/questions/{question_id}")
def update_question_endpoint(question_id: int, data: QuestionUpdate, db: Session = Depends(database.get_db)):
    try:
        return risk_assessment_service.update_question(db, question_id, data.dict(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/questions")
def create_question_endpoint(data: dict, db: Session = Depends(database.get_db)):
    return risk_assessment_service.create_question(db, data)

# --- RISK ASSESSMENT TYPES ---

@router.get("/types")
def list_assessment_types(db: Session = Depends(database.get_db)):
    """
    Returns all configured assessment types (with matrices).
    """
    return risk_assessment_service.get_all_types(db)

@router.put("/types/{type_id}")
def update_assessment_type(type_id: int, data: dict, db: Session = Depends(database.get_db)):
    """
    Updates a specific assessment type, primarily for scoring matrix adjustments.
    """
    try:
        return risk_assessment_service.update_type(db, type_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/types")
def create_assessment_type(data: dict, db: Session = Depends(database.get_db)):
    return risk_assessment_service.create_type(db, data)
