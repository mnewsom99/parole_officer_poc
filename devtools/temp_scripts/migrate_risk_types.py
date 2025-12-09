from backend.database import engine, SessionLocal
from backend.models import Base, RiskAssessmentType
from sqlalchemy import text

def migrate_risk_types():
    print("Starting Risk Assessment Type Migration...")
    
    # Create the new table
    print("Creating new table: risk_assessment_types...")
    RiskAssessmentType.__table__.create(bind=engine, checkfirst=True)
    
    # Seed Initial Data
    db = SessionLocal()
    try:
        # Check if ORAS exists
        oras = db.query(RiskAssessmentType).filter(RiskAssessmentType.name == "ORAS").first()
        if not oras:
            print("Seeding ORAS type...")
            oras = RiskAssessmentType(
                name="ORAS",
                description="Ohio Risk Assessment System",
                scoring_matrix=[
                    {"label": "Low", "min": 0, "max": 14},
                    {"label": "Moderate", "min": 15, "max": 23},
                    {"label": "High", "min": 24, "max": 999}
                ]
            )
            db.add(oras)
        
        # Check if Static-99R exists
        static99 = db.query(RiskAssessmentType).filter(RiskAssessmentType.name == "Static-99R").first()
        if not static99:
            print("Seeding Static-99R type...")
            static99 = RiskAssessmentType(
                name="Static-99R",
                description="Static-99R Sex Offender Risk Assessment",
                scoring_matrix=[
                    {"label": "Low", "min": -3, "max": 1},
                    {"label": "Low-Moderate", "min": 2, "max": 3},
                    {"label": "Moderate-High", "min": 4, "max": 5},
                    {"label": "High", "min": 6, "max": 999}
                ]
            )
            db.add(static99)
            
        db.commit()
        print("Seeding Complete.")
        
    except Exception as e:
        print(f"Error seeding types: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_risk_types()
