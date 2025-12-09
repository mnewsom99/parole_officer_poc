from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from .. import models
import json

def initialize_assessment(db: Session, offender_id: str, assessment_type: str):
    """
    Initializes a new assessment session by:
    1. Finding relevant questions for this assessment type.
    2. Looking up 'Static' data from the Offender profile (Legacy Data).
    3. Looking up 'Dynamic' answers from recent assessments (Look-Back logic).
    """

    # 1. Fetch Questions
    # In a real scenario, we might want a more robust 'LIKE' or array check
    # For now, we fetch all and filter in python or use a simple LIKE
    all_questions = db.query(models.RiskAssessmentQuestion).all()
    
    # Updated filtering logic to handle "ORAS-CST" matching "ORAS"
    questions = []
    for q in all_questions:
        allowed_tools = (q.assessments_list or "").split("|")
        # specific check: if any allowed tool (e.g. "ORAS") is part of the requested type (e.g. "ORAS-CST")
        if any(tool.strip() in assessment_type for tool in allowed_tools):
            questions.append(q)
    
    form_schema = []
    
    # Convert string uuid to object if needed
    import uuid
    if isinstance(offender_id, str):
        try:
            offender_id_obj = uuid.UUID(offender_id)
        except ValueError:
            raise ValueError("Invalid offender_id format")
    else:
        offender_id_obj = offender_id

    offender = db.query(models.Offender).filter(models.Offender.offender_id == offender_id_obj).first()
    if not offender:
        raise ValueError("Offender not found")

    # 30 Day Lookback Date
    lookback_date = datetime.utcnow().date() - timedelta(days=30)
    
    for q in questions:
        field_data = {
            "universal_tag": q.universal_tag,
            "question_text": q.question_text,
            "input_type": q.input_type,
            "source_type": q.source_type,
            "options": q.options,
            "value": None,
            "is_imported": False,
            "source_note": None
        }
        
        # --- LOOK-BACK LOGIC ---
        
        # A. Static Data (Legacy Integration)
        if q.source_type == 'static':
            # Map universal_tags to Offender model columns
            # This is hardcoded for the POC but could be a config map
            val = None
            if q.universal_tag == 'dob':
                val = str(offender.dob) if offender.dob else None
            elif q.universal_tag == 'gender':
                val = offender.gender
            # Add more mappings as legacy fields are added to Offender model
            
            if val is not None:
                field_data['value'] = val
                field_data['is_imported'] = True
                field_data['source_note'] = "Offender Profile (Legacy)"

        # B. Dynamic Data (Recent Answers)
        elif q.source_type == 'dynamic':
            # Find the most recent answer for this tag from THIS offender
            recent_answer = (
                db.query(models.RiskAssessmentAnswer)
                .join(models.RiskAssessment, models.RiskAssessmentAnswer.assessment_id == models.RiskAssessment.assessment_id)
                .filter(models.RiskAssessment.offender_id == offender_id_obj)
                .filter(models.RiskAssessment.date >= lookback_date)
                .filter(models.RiskAssessmentAnswer.question_tag == q.universal_tag)
                .order_by(desc(models.RiskAssessment.date))
                .first()
            )
            
            if recent_answer and recent_answer.value is not None:
                field_data['value'] = recent_answer.value
                field_data['is_imported'] = True
                field_data['source_note'] = f"Imported from Assessment on {recent_answer.assessment.date}"

        form_schema.append(field_data)

    return form_schema

def save_assessment_answer(db: Session, assessment_id: str, tag: str, value):
    """
    Saves or updates a single answer.
    """
    # Check if answer exists
    existing = (
        db.query(models.RiskAssessmentAnswer)
        .filter(models.RiskAssessmentAnswer.assessment_id == assessment_id)
        .filter(models.RiskAssessmentAnswer.question_tag == tag)
        .first()
    )
    
    if existing:
        existing.value = value
    else:
        new_answer = models.RiskAssessmentAnswer(
            assessment_id=assessment_id,
            question_tag=tag,
            value=value
        )
        db.add(new_answer)
    
    db.commit()

def calculate_score(db: Session, assessment_id: str) -> dict:
    """
    Calculates the total risk score based on the answers provided.
    Uses RiskAssessmentType scoring matrix if available.
    Returns: {"total_score": int, "risk_level": str, "details": dict}
    """
    # 1. Get Assessment and Type
    assessment = db.query(models.RiskAssessment).filter(models.RiskAssessment.assessment_id == assessment_id).first()
    if not assessment:
        raise ValueError("Assessment not found")

    assessment_type_obj = db.query(models.RiskAssessmentType).filter(models.RiskAssessmentType.name == assessment.assessment_type).first()

    answers = db.query(models.RiskAssessmentAnswer).filter(models.RiskAssessmentAnswer.assessment_id == assessment_id).all()
    
    total_score = 0
    details = {}
    category_scores = {}
    
    for ans in answers:
        question = db.query(models.RiskAssessmentQuestion).filter(models.RiskAssessmentQuestion.universal_tag == ans.question_tag).first()
        if not question:
            continue
            
        score_val = 0
        
        # Logic A: If Question has 'options' with 'value', iterate to find selected value's weight
        if question.options and isinstance(question.options, list):
            # ans.value might be string "Yes" or value 1 depending on frontend. 
            # Assuming frontend sends the "value" or we match label.
            # Let's assume frontend sends the raw value (e.g., "Yes" or 1).
            
            # Find matching option
            selected_option = next((opt for opt in question.options if opt.get("label") == ans.value or opt.get("value") == ans.value), None)
            if selected_option and "score" in selected_option:
                 score_val = int(selected_option["score"])
            # Fallback: if 'value' in option is numeric, use it? For now assume explicit 'score' key or use 'value' if int.
            elif selected_option and isinstance(selected_option.get("value"), int):
                score_val = selected_option["value"]
                
        # Logic B: If input_type is integer, add it directly (e.g. number of prior arrests)
        elif question.input_type == 'integer':
            try:
                score_val = int(ans.value)
            except (ValueError, TypeError):
                score_val = 0
                
        # Logic C: Boolean (True=1, False=0) - Simple default
        elif question.input_type == 'boolean':
             if str(ans.value).lower() in ['true', '1', 'yes']:
                 score_val = 1
        
        total_score += score_val
        details[ans.question_tag] = score_val
        
        # Category Subtotals
        cat = question.category or "General"
        if cat not in category_scores:
            category_scores[cat] = 0
        category_scores[cat] += score_val

    # Determine Risk Level dynamically
    risk_level = "Unknown"
    
    if assessment_type_obj and assessment_type_obj.scoring_matrix:
        # Dynamic Lookup
        matrix = assessment_type_obj.scoring_matrix
        # Sort matrix by min to ensure correct matching order if needed, but simple iteration works 
        # structure: [{"label": "Low", "min": 0, "max": 14}, ...]
        for rule in matrix:
            min_val = rule.get("min", -999)
            max_val = rule.get("max", 999)
            if min_val <= total_score <= max_val:
                risk_level = rule.get("label", "Unknown")
                break
    else:
        # Fallback Hardcoded Logic
        risk_level = "Low"
        if total_score >= 15:
            risk_level = "High"
        elif total_score >= 8:
            risk_level = "Medium"
        
    return {
        "total_score": total_score,
        "risk_level": risk_level,
        "details": details,
        "category_scores": category_scores
    }

def submit_assessment(
    db: Session, 
    assessment_id: str, 
    final_risk_level: str = None, 
    override_reason: str = None
) -> models.RiskAssessment:
    """
    Finalizes the assessment: Calcs score, applies override (if any), updates status, saves to DB.
    """
    assessment = db.query(models.RiskAssessment).filter(models.RiskAssessment.assessment_id == assessment_id).first()
    if not assessment:
        raise ValueError("Assessment not found")
        
    result = calculate_score(db, assessment_id)
    
    assessment.total_score = result["total_score"]
    assessment.risk_level = result["risk_level"]
    assessment.details = result["details"]
    assessment.status = "Completed"
    
    # Handle Override
    if final_risk_level:
        assessment.final_risk_level = final_risk_level
        assessment.override_reason = override_reason
    else:
        assessment.final_risk_level = assessment.risk_level

    # Update Active Supervision Episode Risk Level
    episode = (
        db.query(models.SupervisionEpisode)
        .filter(models.SupervisionEpisode.offender_id == assessment.offender_id)
        .filter(models.SupervisionEpisode.status == 'Active')
        .first()
    )
    if episode:
        episode.current_risk_level = assessment.final_risk_level
    
    db.commit()
    db.refresh(assessment)
    return assessment


# --- ADMIN FUNCTIONS ---

def get_all_questions(db: Session):
    return db.query(models.RiskAssessmentQuestion).all()

def update_question(db: Session, question_id: int, data: dict):
    q = db.query(models.RiskAssessmentQuestion).filter(models.RiskAssessmentQuestion.question_id == question_id).first()
    if not q:
        raise ValueError("Question not found")
    
    for key, value in data.items():
        if hasattr(q, key):
            setattr(q, key, value)
    
    db.commit()
    db.refresh(q)
    return q

def create_question(db: Session, data: dict):
    new_q = models.RiskAssessmentQuestion(**data)
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q

def get_all_types(db: Session):
    return db.query(models.RiskAssessmentType).all()

def update_type(db: Session, type_id: int, data: dict):
    t = db.query(models.RiskAssessmentType).filter(models.RiskAssessmentType.type_id == type_id).first()
    if not t:
        raise ValueError("Assessment Type not found")
    
    for key, value in data.items():
        if hasattr(t, key):
            setattr(t, key, value)
            
    db.commit()
    db.refresh(t)
    return t

def create_type(db: Session, data: dict):
    # Ensure correct matching logic (e.g. unique name)
    existing = db.query(models.RiskAssessmentType).filter(models.RiskAssessmentType.name == data.get("name")).first()
    if existing:
         raise ValueError("Assessment Type with this name already exists")
         
    new_t = models.RiskAssessmentType(**data)
    db.add(new_t)
    db.commit()
    db.refresh(new_t)
    return new_t

