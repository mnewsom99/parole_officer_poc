from backend.database import engine
from backend.models import Base, RiskAssessmentQuestion, RiskAssessmentAnswer, RiskAssessment
from sqlalchemy import text

def migrate_risk_tables():
    print("Starting Risk Assessment Migration...")
    
    # Create the new tables
    print("Creating new tables: risk_assessment_questions, risk_assessment_answers...")
    RiskAssessmentQuestion.__table__.create(bind=engine, checkfirst=True)
    RiskAssessmentAnswer.__table__.create(bind=engine, checkfirst=True)
    
    # Add columns to existing RiskAssessment table if they don't exist
    print("Checking for new columns in risk_assessments...")
    
    # Check assessment_type
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT assessment_type FROM risk_assessments LIMIT 1"))
            print("Column assessment_type exists.")
        except Exception:
            print("Adding column: assessment_type")
            # Must rollback the failed transaction before starting a new one in Postgres
            conn.rollback() 
            conn.execute(text("ALTER TABLE risk_assessments ADD COLUMN assessment_type VARCHAR(50)"))
            conn.commit()

    # Check status
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT status FROM risk_assessments LIMIT 1"))
            print("Column status exists.")
        except Exception:
            print("Adding column: status")
            conn.rollback()
            conn.execute(text("ALTER TABLE risk_assessments ADD COLUMN status VARCHAR(20) DEFAULT 'Draft'"))
            conn.commit()

    # Check final_risk_level
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT final_risk_level FROM risk_assessments LIMIT 1"))
            print("Column final_risk_level exists.")
        except Exception:
            print("Adding column: final_risk_level")
            conn.rollback()
            conn.execute(text("ALTER TABLE risk_assessments ADD COLUMN final_risk_level VARCHAR(20)"))
            conn.commit()

    # Check override_reason
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT override_reason FROM risk_assessments LIMIT 1"))
            print("Column override_reason exists.")
        except Exception:
            print("Adding column: override_reason")
            conn.rollback()
            conn.execute(text("ALTER TABLE risk_assessments ADD COLUMN override_reason VARCHAR(255)"))
            conn.commit()

    # Check SupervisionEpisode.current_risk_level
    print("Checking for new columns in supervision_episodes...")
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT current_risk_level FROM supervision_episodes LIMIT 1"))
            print("Column current_risk_level exists.")
        except Exception:
            print("Adding column: current_risk_level")
            conn.rollback()
            conn.execute(text("ALTER TABLE supervision_episodes ADD COLUMN current_risk_level VARCHAR(20)"))
            conn.commit()

    # Check RiskAssessmentQuestion.category (NEW)
    print("Checking for new columns in risk_assessment_questions...")
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT category FROM risk_assessment_questions LIMIT 1"))
            print("Column category exists.")
        except Exception:
            print("Adding column: category")
            conn.rollback()
            conn.execute(text("ALTER TABLE risk_assessment_questions ADD COLUMN category VARCHAR(50)"))
            conn.commit()

    print("Migration Complete.")

if __name__ == "__main__":
    migrate_risk_tables()
