from database import SessionLocal
from models import AutomationRule

db = SessionLocal()

defaults = [
    {
        "name": "Home Visit Intake",
        "trigger_field": "release_date",
        "trigger_offset": 2,
        "trigger_direction": "after",
        "conditions": [],
        "task_title": "Home Visit Intake",
        "task_description": "Mandatory intake at residence. Verify address and living conditions.",
        "task_priority": "High",
        "due_offset": 0
    },
    {
        "name": "45-Day Risk Review",
        "trigger_field": "release_date",
        "trigger_offset": 45,
        "trigger_direction": "after",
        "conditions": [{"field": "risk_level", "operator": "equals", "value": "High"}],
        "task_title": "45-Day Risk Assessment Review",
        "task_description": "Mandatory risk assessment review for High risk offender.",
        "task_priority": "High",
        "due_offset": 7
    },
    {
        "name": "CSED Closeout",
        "trigger_field": "csed_date",
        "trigger_offset": 0,
        "trigger_direction": "after", # On the date
        "conditions": [],
        "task_title": "Complete Closeout",
        "task_description": "Supervision expiration. Complete closeout paperwork.",
        "task_priority": "Normal",
        "due_offset": 5
    }
]

print("Seeding Default Automation Rules...")
for rule_data in defaults:
    exists = db.query(AutomationRule).filter(AutomationRule.name == rule_data["name"]).first()
    if not exists:
        rule = AutomationRule(**rule_data)
        db.add(rule)
        print(f"Created rule: {rule_data['name']}")
    else:
        print(f"Rule already exists: {rule_data['name']}")

db.commit()
db.close()
