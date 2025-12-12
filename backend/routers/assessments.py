from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from .. import database, models, schemas
from ..services import risk_assessment_service
from sqlalchemy import text

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
    try:
        return risk_assessment_service.create_type(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/types/{type_id}")
def delete_assessment_type(type_id: int, db: Session = Depends(database.get_db)):
    try:
        return risk_assessment_service.delete_type(db, type_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW GENERIC ASSESSMENT ENGINE ENDPOINTS ---

@router.post("/instruments", response_model=schemas.AssessmentInstrument)
def create_instrument(instrument: schemas.AssessmentInstrumentCreate, db: Session = Depends(database.get_db)):
    """
    Create a new Assessment Instrument with full nested structure (Domains -> Items -> Options).
    """
    # 1. Create Instrument
    db_instrument = models.AssessmentInstrument(
        name=instrument.name,
        version=instrument.version,
        target_populations=instrument.target_populations,
        scoring_method=instrument.scoring_method,
        is_active=instrument.is_active
    )
    db.add(db_instrument)
    db.flush() # Generate ID

    # 2. Create Domains & Items
    for d in instrument.domains:
        db_domain = models.AssessmentDomain(
            instrument_id=db_instrument.instrument_id,
            name=d.name,
            order_index=d.order_index,
            max_score=d.max_score
        )
        db.add(db_domain)
        db.flush()

        for i in d.items:
            db_item = models.AssessmentItem(
                domain_id=db_domain.domain_id,
                text=i.text,
                control_type=i.control_type,
                order_index=i.order_index,
                custom_tags=i.custom_tags
            )
            db.add(db_item)
            db.flush()

            for o in i.options:
                db_option = models.AssessmentOption(
                    item_id=db_item.item_id,
                    label=o.label,
                    value=o.value,
                    points=o.points,
                    order_index=o.order_index
                )
                db.add(db_option)

    # 3. Create Scoring Tables
    for st in instrument.scoring_tables:
        db_table = models.ScoringTable(
            instrument_id=db_instrument.instrument_id,
            population_filter=st.population_filter,
            min_score=st.min_score,
            max_score=st.max_score,
            result_level=st.result_level,
            recommendation=st.recommendation
        )
        db.add(db_table)

    db.commit()
    db.refresh(db_instrument)
    return db_instrument

@router.get("/instruments", response_model=list[schemas.AssessmentInstrument])
def list_instruments(db: Session = Depends(database.get_db)):
    """
    List all Assessment Instruments.
    """
    return db.query(models.AssessmentInstrument).all()

@router.get("/instruments/{instrument_id}", response_model=schemas.AssessmentInstrument)
def get_instrument(instrument_id: UUID, db: Session = Depends(database.get_db)):
    """
    Get a specific instrument by ID with full nested structure.
    """
    instrument = db.query(models.AssessmentInstrument).filter(models.AssessmentInstrument.instrument_id == instrument_id).first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    return instrument

@router.put("/instruments/{instrument_id}", response_model=schemas.AssessmentInstrument)
def update_instrument(instrument_id: UUID, instrument_data: schemas.AssessmentInstrumentCreate, db: Session = Depends(database.get_db)):
    """
    Update a specific instrument.
    Strategy: Full replacement of children (Domains, Items, Scoring Tables).
    """
    db_instrument = db.query(models.AssessmentInstrument).filter(models.AssessmentInstrument.instrument_id == instrument_id).first()
    if not db_instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")

    # 1. Update Root Fields
    db_instrument.name = instrument_data.name
    db_instrument.version = instrument_data.version
    db_instrument.target_populations = instrument_data.target_populations
    db_instrument.scoring_method = instrument_data.scoring_method
    db_instrument.is_active = instrument_data.is_active

    # 2. Clear existing children
    # Use raw SQL to ensure cascade deletion works regardless of ORM state
    # A. Delete Scoring Tables
    db.execute(
        text("DELETE FROM scoring_tables WHERE instrument_id = :iid"),
        {"iid": instrument_id}
    )
    
    # B. Delete Options (via Items -> Domains)
    db.execute(
        text("""
        DELETE FROM assessment_options 
        WHERE item_id IN (
            SELECT item_id FROM assessment_items 
            WHERE domain_id IN (
                SELECT domain_id FROM assessment_domains 
                WHERE instrument_id = :iid
            )
        )
        """),
        {"iid": instrument_id}
    )

    # C. Delete Items (via Domains)
    db.execute(
        text("""
        DELETE FROM assessment_items 
        WHERE domain_id IN (
            SELECT domain_id FROM assessment_domains 
            WHERE instrument_id = :iid
        )
        """),
        {"iid": instrument_id}
    )

    # D. Delete Domains
    db.execute(
        text("DELETE FROM assessment_domains WHERE instrument_id = :iid"),
        {"iid": instrument_id}
    )
    db.flush()

    # Map to track Old-UUID -> New-DB-UUID for domains (to fix scoring table references)
    domain_id_map = {}

    # 3. Re-create Domains & Items
    for d in instrument_data.domains:
        db_domain = models.AssessmentDomain(
            instrument_id=db_instrument.instrument_id,
            name=d.name,
            order_index=d.order_index,
            max_score=d.max_score
        )
        db.add(db_domain)
        db.flush() # Generate new domain_id

        # Track mapping if provided
        if d.id:
            domain_id_map[d.id] = db_domain.domain_id

        for i in d.items:
            db_item = models.AssessmentItem(
                domain_id=db_domain.domain_id,
                text=i.text,
                control_type=i.control_type,
                order_index=i.order_index,
                custom_tags=i.custom_tags
            )
            db.add(db_item)
            db.flush() 

            for o in i.options:
                db_option = models.AssessmentOption(
                    item_id=db_item.item_id,
                    label=o.label,
                    value=o.value,
                    points=o.points,
                    order_index=o.order_index
                )
                db.add(db_option)

    # 4. Re-create Scoring Tables
    for st in instrument_data.scoring_tables:
        # Resolve domain_id reference
        target_domain_id = st.domain_id
        if target_domain_id and target_domain_id in domain_id_map:
            target_domain_id = domain_id_map[target_domain_id]
        
        # If the domain_id was not in the map but was provided, it might be dead or intended for Total (if None).
        # Proceed with mapped ID.

        db_table = models.ScoringTable(
            instrument_id=db_instrument.instrument_id,
            domain_id=target_domain_id,
            population_filter=st.population_filter,
            min_score=st.min_score,
            max_score=st.max_score,
            result_level=st.result_level,
            recommendation=st.recommendation
        )
        db.add(db_table)
        
    db.commit()
    db.refresh(db_instrument)
    return db_instrument

@router.delete("/instruments/{instrument_id}")
def delete_instrument(instrument_id: UUID, db: Session = Depends(database.get_db)):
    """
    Delete a specific instrument and all its related domains, items, and options (via cascade).
    """
    instrument = db.query(models.AssessmentInstrument).filter(models.AssessmentInstrument.instrument_id == instrument_id).first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    
    try:
        db.delete(instrument)
        db.commit()
        return {"status": "success", "message": f"Deleted instrument {instrument_id}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

