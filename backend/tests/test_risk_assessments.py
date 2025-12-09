from datetime import date, timedelta
from backend.models import RiskAssessment, RiskAssessmentAnswer, RiskAssessmentQuestion

def test_init_assessment_schema(client, test_offender, db_session):
    # 1. Seed Questions (Manually for test isolation)
    q1 = RiskAssessmentQuestion(
        universal_tag="dob", 
        question_text="Date of Birth", 
        input_type="date", 
        source_type="static", 
        assessments_list="ORAS"
    )
    q2 = RiskAssessmentQuestion(
        universal_tag="substance_use", 
        question_text="Recent drug use?", 
        input_type="boolean", 
        source_type="dynamic", 
        assessments_list="ORAS"
    )
    db_session.add_all([q1, q2])
    db_session.commit()

    # 2. Call Init Endpoint
    response = client.get(f"/assessments/init?offender_id={test_offender.offender_id}&assessment_type=ORAS")
    assert response.status_code == 200
    schema = response.json()
    
    # 3. Verify Structure
    assert len(schema) == 2
    
    # Verify Static Import (DOB)
    dob_field = next(f for f in schema if f["universal_tag"] == "dob")
    assert dob_field["value"] is not None
    assert dob_field["is_imported"] is True
    assert dob_field["value"] == str(test_offender.dob)

def test_lookback_logic(client, test_offender, db_session):
    # 1. Seed Question
    q1 = RiskAssessmentQuestion(
        universal_tag="employment_status", 
        question_text="Employed?", 
        input_type="boolean", 
        source_type="dynamic", 
        assessments_list="ORAS"
    )
    db_session.add(q1)
    db_session.commit()

    # 2. Seed a PAST Assessment (10 days ago) with an answer
    past_date = date.today() - timedelta(days=10)
    old_assessment = RiskAssessment(
        offender_id=test_offender.offender_id,
        assessment_type="ORAS",
        date=past_date,
        status="Completed"
    )
    db_session.add(old_assessment)
    db_session.flush()

    old_answer = RiskAssessmentAnswer(
        assessment_id=old_assessment.assessment_id,
        question_tag="employment_status",
        value=True 
    )
    db_session.add(old_answer)
    db_session.commit()

    # 3. Call Init for NEW Assessment
    response = client.get(f"/assessments/init?offender_id={test_offender.offender_id}&assessment_type=ORAS")
    assert response.status_code == 200
    schema = response.json()

    # 4. Verify Pre-fill
    field = next(f for f in schema if f["universal_tag"] == "employment_status")
    assert field["value"] is True
    assert field["is_imported"] is True
    assert "Imported from Assessment" in field["source_note"]

def test_scoring_logic(client, test_offender, db_session):
    # 1. Seed Scorable Questions
    # Integer based
    q1 = RiskAssessmentQuestion(
        universal_tag="priors",
        question_text="Prior Arrests",
        input_type="integer",
        source_type="dynamic",
        assessments_list="ORAS"
    )
    # Boolean based
    q2 = RiskAssessmentQuestion(
        universal_tag="gang_affil",
        question_text="Gang Affiliated?",
        input_type="boolean",
        source_type="dynamic",
        assessments_list="ORAS"
    )
    # Select based with Options
    q3 = RiskAssessmentQuestion(
        universal_tag="education",
        question_text="Education Level",
        input_type="select",
        source_type="dynamic",
        assessments_list="ORAS",
        options=[
            {"label": "High School", "value": 0, "score": 0},
            {"label": "No Diploma", "value": 1, "score": 5}
        ]
    )
    db_session.add_all([q1, q2, q3])
    db_session.commit()

    # 2. Create Assessment Session
    assess_date = date.today()
    assess_resp = client.post(
        f"/assessments/?offender_id={test_offender.offender_id}&assessment_type=ORAS&date={assess_date}"
    )
    assert assess_resp.status_code == 200
    assessment_id = assess_resp.json()["assessment_id"]

    # 3. Submit Answers
    # Answer 1: 3 Priors -> Score 3
    client.post(f"/assessments/{assessment_id}/save", json={"tag": "priors", "value": 3})
    
    # Answer 2: Gang Yes -> Score 1
    client.post(f"/assessments/{assessment_id}/save", json={"tag": "gang_affil", "value": True})

    # Answer 3: No Diploma -> Score 5
    client.post(f"/assessments/{assessment_id}/save", json={"tag": "education", "value": "No Diploma"})

    # Total Score should be 3 + 1 + 5 = 9 -> Medium Risk (>=8)

    # 4. Submit Assessment
    submit_resp = client.post(f"/assessments/{assessment_id}/submit")
    assert submit_resp.status_code == 200
    result = submit_resp.json()

    assert result["status"] == "completed"
    assert result["total_score"] == 9
    assert result["risk_level"] == "Medium"
    
    # 5. Verify Offender Risk Level Updated
    # Refresh test_offender. Note: test_offender is an Offender object, we need to check its active episode.
    from backend.models import SupervisionEpisode
    episode = db_session.query(SupervisionEpisode).filter(
        SupervisionEpisode.offender_id == test_offender.offender_id,
        SupervisionEpisode.status == "Active"
    ).first()
    assert episode is not None
    assert episode.current_risk_level == "Medium"

def test_override_logic(client, test_offender, db_session):
    # 1. Create Assessment
    assess_date = date.today()
    assess_resp = client.post(
        f"/assessments/?offender_id={test_offender.offender_id}&assessment_type=OverrideTest&date={assess_date}"
    )
    assessment_id = assess_resp.json()["assessment_id"]

    # 2. Preview Calculation (Wait, we have no questions, so score=0, Risk=Low)
    calc_resp = client.get(f"/assessments/{assessment_id}/calculate")
    assert calc_resp.status_code == 200
    assert calc_resp.json()["risk_level"] == "Low"

    # 3. Submit with Override
    submit_body = {
        "final_risk_level": "High",
        "override_reason": "Officer Intuition"
    }
    submit_resp = client.post(f"/assessments/{assessment_id}/submit", json=submit_body)
    assert submit_resp.status_code == 200
    
    result = submit_resp.json()
    assert result["risk_level"] == "Low" # Calculated
    assert result["final_risk_level"] == "High" # Overridden

    # 4. Verify Episode Update
    from backend.models import SupervisionEpisode
    episode = db_session.query(SupervisionEpisode).filter(
        SupervisionEpisode.offender_id == test_offender.offender_id,
        SupervisionEpisode.status == "Active"
    ).first()
    assert episode.current_risk_level == "High"
