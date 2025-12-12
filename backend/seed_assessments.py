import sys
import os

# Add parent dir to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine
from backend import models
from sqlalchemy.orm import Session

def seed_cst(db: Session):
    print("Seeding ORAS-CST (Community Supervision Tool)...")
    
    # Check if exists
    name = "ORAS-CST"
    existing = db.query(models.AssessmentInstrument).filter(models.AssessmentInstrument.name == name).first()
    if existing:
        print(f"  - {name} already exists. Skipping.")
        return

    # Create Instrument
    inst = models.AssessmentInstrument(
        name=name,
        version="v1.0",
        target_populations=["General"],
        scoring_method="Additive",
        is_active=True
    )
    db.add(inst)
    db.flush()

    # --- Domain 1: Criminal History (Sample) ---
    d1 = models.AssessmentDomain(instrument_id=inst.instrument_id, name="Criminal History", order_index=1, max_score=10)
    db.add(d1)
    db.flush()

    # Q1
    q1 = models.AssessmentItem(domain_id=d1.domain_id, text="Most Serious Arrest Under Age 18", control_type="Radio", order_index=1)
    db.add(q1)
    db.flush()
    db.add(models.AssessmentOption(item_id=q1.item_id, label="No", value="0", points=0, order_index=1))
    db.add(models.AssessmentOption(item_id=q1.item_id, label="Yes", value="1", points=1, order_index=2))

    # Q2
    q2 = models.AssessmentItem(domain_id=d1.domain_id, text="Number of Prior Adult Felony Convictions", control_type="Radio", order_index=2)
    db.add(q2)
    db.flush()
    db.add(models.AssessmentOption(item_id=q2.item_id, label="None", value="0", points=0, order_index=1))
    db.add(models.AssessmentOption(item_id=q2.item_id, label="One or Two", value="1", points=1, order_index=2))
    db.add(models.AssessmentOption(item_id=q2.item_id, label="Three or More", value="2", points=2, order_index=3))

    # --- Domain 2: Education, Employment, and Financial Situation ---
    d2 = models.AssessmentDomain(instrument_id=inst.instrument_id, name="Education, Employment & Finances", order_index=2, max_score=8)
    db.add(d2)
    db.flush()

    q3 = models.AssessmentItem(domain_id=d2.domain_id, text="Highest Education Level", control_type="Radio", order_index=1)
    db.add(q3)
    db.flush()
    db.add(models.AssessmentOption(item_id=q3.item_id, label="High School Graduate/GED or Higher", value="0", points=0, order_index=1))
    db.add(models.AssessmentOption(item_id=q3.item_id, label="Less than High School/GED", value="1", points=1, order_index=2))

    q4 = models.AssessmentItem(domain_id=d2.domain_id, text="Currently Employed?", control_type="Radio", order_index=2)
    db.add(q4)
    db.flush()
    db.add(models.AssessmentOption(item_id=q4.item_id, label="Yes, Full-time", value="0", points=0, order_index=1))
    db.add(models.AssessmentOption(item_id=q4.item_id, label="No / Part-time / Unstable", value="1", points=1, order_index=2))

    # --- Scoring Tables ---
    # Example ranges (Hypothetical for POC)
    db.add(models.ScoringTable(instrument_id=inst.instrument_id, population_filter="All", min_score=0, max_score=14, result_level="Low", recommendation="Minimum Supervision"))
    db.add(models.ScoringTable(instrument_id=inst.instrument_id, population_filter="All", min_score=15, max_score=23, result_level="Moderate", recommendation="Regular Supervision"))
    db.add(models.ScoringTable(instrument_id=inst.instrument_id, population_filter="All", min_score=24, max_score=99, result_level="High", recommendation="Intensive Supervision"))

    print(f"  - Created {name}")


def seed_csst(db: Session):
    print("Seeding ORAS-CSST (Screening Tool)...")
    
    # Check if exists
    name = "ORAS-CSST"
    existing = db.query(models.AssessmentInstrument).filter(models.AssessmentInstrument.name == name).first()
    if existing:
        print(f"  - {name} already exists. Skipping.")
        return

    # Create Instrument
    inst = models.AssessmentInstrument(
        name=name,
        version="v1.0",
        target_populations=["General"],
        scoring_method="Additive",
        is_active=True
    )
    db.add(inst)
    db.flush()

    # --- Domain 1: General Risk Factors ---
    d1 = models.AssessmentDomain(instrument_id=inst.instrument_id, name="General Screening", order_index=1, max_score=7)
    db.add(d1)
    db.flush()

    # Q1
    q1 = models.AssessmentItem(domain_id=d1.domain_id, text="Age at First Arrest", control_type="Radio", order_index=1)
    db.add(q1)
    db.flush()
    db.add(models.AssessmentOption(item_id=q1.item_id, label="33 or older", value="0", points=0, order_index=1))
    db.add(models.AssessmentOption(item_id=q1.item_id, label="Under 33", value="1", points=1, order_index=2))

    # Q2
    q2 = models.AssessmentItem(domain_id=d1.domain_id, text="Number of Prior Adult Felony Convictions", control_type="Radio", order_index=2)
    db.add(q2)
    db.flush()
    db.add(models.AssessmentOption(item_id=q2.item_id, label="None", value="0", points=0, order_index=1))
    db.add(models.AssessmentOption(item_id=q2.item_id, label="One or more", value="1", points=1, order_index=2))

    # Q3
    q3 = models.AssessmentItem(domain_id=d1.domain_id, text="Currently Employed?", control_type="Radio", order_index=3)
    db.add(q3)
    db.flush()
    db.add(models.AssessmentOption(item_id=q3.item_id, label="Yes", value="0", points=0, order_index=1))
    db.add(models.AssessmentOption(item_id=q3.item_id, label="No", value="1", points=1, order_index=2))
    
    # Q4
    q4 = models.AssessmentItem(domain_id=d1.domain_id, text="Current Drug Use?", control_type="Radio", order_index=4)
    db.add(q4)
    db.flush()
    db.add(models.AssessmentOption(item_id=q4.item_id, label="No", value="0", points=0, order_index=1))
    db.add(models.AssessmentOption(item_id=q4.item_id, label="Yes", value="1", points=1, order_index=2))

    # --- Scoring Tables ---
    db.add(models.ScoringTable(instrument_id=inst.instrument_id, population_filter="All", min_score=0, max_score=2, result_level="Low", recommendation="Presumptive Low Risk"))
    db.add(models.ScoringTable(instrument_id=inst.instrument_id, population_filter="All", min_score=3, max_score=4, result_level="Moderate/High", recommendation="Full Assessment Required"))

    print(f"  - Created {name}")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_cst(db)
        seed_csst(db)
        db.commit()
        print("Seeding Complete.")
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()
