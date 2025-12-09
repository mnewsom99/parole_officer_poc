import csv
import json
from backend.database import get_db
from backend.models import RiskAssessmentQuestion

def seed_risk_questions():
    print("Seeding Risk Assessment Questions from CSV...")
    db = next(get_db())
    
    try:
        with open('risk_questions.csv', mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                tag = row['universal_tag'].strip()
                
                # Check directly in loop to allow updates
                existing = db.query(RiskAssessmentQuestion).filter(RiskAssessmentQuestion.universal_tag == tag).first()
                if not existing:
                    existing = RiskAssessmentQuestion(universal_tag=tag)
                    db.add(existing)
                
                existing.question_text = row['question_text']
                existing.input_type = row['input_type']
                existing.source_type = row['source_type']
                existing.source_type = row['source_type']
                existing.assessments_list = row['assessments']
                existing.category = row.get('category', 'General') # Default to General if missing
                existing.scoring_note = row['scoring_note']
                
                # Basic Logic to generate options based on input_type or text
                options = []
                if row['input_type'] == 'boolean':
                    options = [{"label": "Yes", "value": True}, {"label": "No", "value": False}]
                elif row['input_type'] == 'scale_0_3':
                    options = [
                        {"label": "0 - None", "value": 0},
                        {"label": "1 - Low", "value": 1},
                        {"label": "2 - Moderate", "value": 2},
                        {"label": "3 - High", "value": 3}
                    ]
                
                existing.options = options

            db.commit()
            print("Questions seeded successfully.")
    except Exception as e:
        print(f"Error seeding questions: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_risk_questions()
