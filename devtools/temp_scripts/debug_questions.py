from backend.database import get_db
from backend.models import RiskAssessmentQuestion

def check_questions():
    db = next(get_db())
    questions = db.query(RiskAssessmentQuestion).all()
    print(f"Total Questions: {len(questions)}")
    for q in questions:
        print(f"Tag: {q.universal_tag.ljust(25)} | Assessments: {q.assessments_list}")

if __name__ == "__main__":
    check_questions()
