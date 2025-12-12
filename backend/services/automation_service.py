from sqlalchemy.orm import Session
from .. import models
import datetime

def check_automations(db: Session, event_name: str, offender_id: str):
    """
    Evaluates automation rules triggered by a specific event (e.g., 'positive_ua').
    """
    # Resolve offender object if ID is passed
    if isinstance(offender_id, str) or isinstance(offender_id, models.UUID):
        offender = db.query(models.Offender).filter(models.Offender.offender_id == offender_id).first()
    else:
        offender = offender_id # Assume object passed
        
    if not offender:
        print(f"DEBUG: Offender {offender_id} not found for automation check.")
        return

    print(f"DEBUG: Checking automations for event '{event_name}' on offender {offender.last_name}")
    
    # 1. Fetch active rules for this trigger
    rules = db.query(models.AutomationRule).filter(
        models.AutomationRule.trigger_field == event_name,
        models.AutomationRule.is_active == True
    ).all()
    
    if not rules:
        print("DEBUG: No rules found for this event.")
        return

    # 2. Evaluate Conditions & Execute Actions
    for rule in rules:
        is_match = True
        for cond in rule.conditions:
            field = cond.get('field')
            operator = cond.get('operator')
            value = cond.get('value')
            
            # Resolve actual value
            actual_value = getattr(offender, field, None)
            
            # --- Condition Logic ---
            try:
                # String Operations
                if operator == 'equals':
                    if str(actual_value) != str(value): is_match = False
                elif operator == 'not_equals':
                    if str(actual_value) == str(value): is_match = False
                elif operator == 'contains':
                    if value.lower() not in str(actual_value or '').lower(): is_match = False
                elif operator == 'starts_with':
                    if not str(actual_value or '').lower().startswith(value.lower()): is_match = False
                elif operator == 'is_empty':
                    if actual_value is not None and str(actual_value).strip() != '': is_match = False
                elif operator == 'is_not_empty':
                    if actual_value is None or str(actual_value).strip() == '': is_match = False
                
                # Numeric Operations
                elif operator in ['num_equals', 'greater_than', 'less_than', 'is_between']:
                    try:
                        num_actual = float(actual_value or 0)
                    except (ValueError, TypeError):
                        num_actual = 0
                        
                    if operator == 'is_between':
                         # Parse "X and Y" or "X-Y"
                         val_str = str(value).lower().replace(' and ', ',').replace('-', ',')
                         parts = [float(x.strip()) for x in val_str.split(',') if x.strip()]
                         if len(parts) >= 2:
                             if not (parts[0] <= num_actual <= parts[1]): is_match = False
                         else:
                             print(f"DEBUG: Invalid range format for is_between: {value}")
                             is_match = False
                    else:
                        num_val = float(value or 0)
                        if operator == 'num_equals' and num_actual != num_val: is_match = False
                        elif operator == 'greater_than' and num_actual <= num_val: is_match = False
                        elif operator == 'less_than' and num_actual >= num_val: is_match = False
                
                # Date Operations
                elif operator in ['date_equals', 'is_before', 'is_after']:
                    # Assuming actual_value is date object or ISO string, and value is YYYY-MM-DD
                    date_val = datetime.datetime.strptime(value, "%Y-%m-%d").date()
                    
                    if actual_value:
                        date_actual = actual_value if isinstance(actual_value, datetime.date) else datetime.datetime.strptime(str(actual_value)[:10], "%Y-%m-%d").date()
                        
                        if operator == 'date_equals' and date_actual != date_val: is_match = False
                        elif operator == 'is_before' and date_actual >= date_val: is_match = False
                        elif operator == 'is_after' and date_actual <= date_val: is_match = False
                    else:
                        is_match = False # Date required but missing
                    
            except Exception as e:
                print(f"DEBUG: Error evaluating condition {field} {operator} {value}: {e}")
                is_match = False
                
            if not is_match:
                break
                
        if is_match:
            print(f"DEBUG: Rule '{rule.name}' matched! Creating task...")
            
            # Create Task
            # Calculate due date
            due_date = datetime.datetime.utcnow() + datetime.timedelta(days=rule.due_offset)
            
            new_task = models.Task(
                title=rule.task_title,
                description=rule.task_description or f"Auto-generated from rule: {rule.name}",
                priority=rule.task_priority,
                status="Pending",
                due_date=due_date,
                offender_id=offender.offender_id,
                assigned_officer_id=offender.assigned_officer_id, # Assign to their officer
                category="Supervision",
                is_parole_plan=rule.action_is_parole_plan # Added
            )
            db.add(new_task)
            db.commit()
