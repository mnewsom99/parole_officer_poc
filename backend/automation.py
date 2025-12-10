from datetime import datetime, timedelta, time
from sqlalchemy.orm import Session
from . import models

def run_daily_automations(db: Session):
    """
    Runs daily automation rules to generate tasks based on offender milestones.
    Fetches rules dynamically from 'automation_rules' table.
    """
    print("Running Daily Automations (Dynamic Engine)...")
    today = datetime.now().date()
    
    # Fetch active rules
    rules = db.query(models.AutomationRule).filter(models.AutomationRule.is_active == True).all()
    
    # Fetch all offenders
    offenders = db.query(models.Offender).all()
    
    actions_count = 0
    
    for offender in offenders:
        # Get active episode for context (Officer, Risk Level, etc.)
        episode = db.query(models.SupervisionEpisode).filter(
            models.SupervisionEpisode.offender_id == offender.offender_id,
            models.SupervisionEpisode.status == 'Active'
        ).first()
        
        # If no active supervision, skip? 
        # Some rules might apply to 'Pending' intakes, but generally we need an officer Assignment.
        # Use fallback if episode missing? For now, require episode or skip task assignment.
        assigned_officer_id = episode.assigned_officer_id if episode else None
        
        for rule in rules:
            try:
                if check_trigger(rule, offender, today) and check_conditions(rule, offender, episode):
                    if execute_action(db, rule, offender, episode, assigned_officer_id):
                        actions_count += 1
            except Exception as e:
                print(f"Error processing rule {rule.name} for offender {offender.last_name}: {e}")

    db.commit()
    print(f"Automation Complete. Generated {actions_count} tasks based on {len(rules)} active rules.")

def check_trigger(rule, offender, today):
    """
    Check if the rule should trigger today (or if we missed it recently).
    """
    # Get the date field from offender
    trigger_date = getattr(offender, rule.trigger_field, None)
    
    # Handle string dates if necessary
    if isinstance(trigger_date, str):
        try:
            trigger_date = datetime.strptime(trigger_date, "%Y-%m-%d").date()
        except ValueError:
            return False
            
    if not trigger_date:
        return False
        
    # Calculate target date
    delta = timedelta(days=rule.trigger_offset)
    if rule.trigger_direction == 'before':
        target_date = trigger_date - delta
    else: # 'after'
        target_date = trigger_date + delta
        
    # Trigger Logic: 
    # Strict: target_date == today
    # Catch-up: target_date <= today AND target_date > (today - 30 days) AND not executed?
    # For this POC, let's use Catch-up window of 7 days to ensure we see results.
    window_start = today - timedelta(days=7)
    
    return window_start <= target_date <= today

def check_conditions(rule, offender, episode):
    """
    Check if offender meets custom conditions (e.g. Risk Level == High).
    """
    if not rule.conditions:
        return True # No conditions = run for everyone matching trigger
        
    for condition in rule.conditions:
        field = condition.get('field')
        operator = condition.get('operator')
        value = condition.get('value')
        
        # Determine value to check
        # Fields can be on Offender or Episode
        # e.g. 'risk_level' is usually on Episode
        actual_value = None
        
        if field == 'risk_level' and episode:
            actual_value = episode.risk_level_at_start # or current_risk_level
        elif hasattr(offender, field):
            actual_value = getattr(offender, field)
        elif episode and hasattr(episode, field):
             actual_value = getattr(episode, field)
             
        # Normalize for comparison
        actual_str = str(actual_value) if actual_value is not None else ""
        
        # Compare
        if operator == 'equals':
            if actual_str.lower() != str(value).lower():
                return False
        elif operator == 'not_equals':
             if actual_str.lower() == str(value).lower():
                return False
        # Add more operators as needed
        
    return True

def execute_action(db, rule, offender, episode, officer_id):
    """
    Perform the action (Create Task).
    Returns True if action was taken (task created), False if existed.
    """
    if not officer_id:
        return False # Can't assign task
        
    # Check if task already exists (Idempotency)
    # We match on Title + Episode ID
    if episode:
        exists = db.query(models.Task).filter(
            models.Task.title == rule.task_title,
            models.Task.episode_id == episode.episode_id
        ).first()
        if exists:
            return False
            
    # Calculate Due Date
    # Base it on the trigger target date to be accurate? 
    # Or just today + due_offset?
    # Requirement: "Due Date: Trigger + X days"
    
    # Re-calculate trigger base date
    trigger_date_val = getattr(offender, rule.trigger_field, None)
    if isinstance(trigger_date_val, str):
         trigger_date_val = datetime.strptime(trigger_date_val, "%Y-%m-%d").date()
    
    # Recalculate execution date (when it SHOULD have fired)
    delta = timedelta(days=rule.trigger_offset)
    if rule.trigger_direction == 'before':
        execution_date = trigger_date_val - delta
    else:
        execution_date = trigger_date_val + delta
        
    due_date = execution_date + timedelta(days=rule.due_offset)
    
    # Create Task
    new_task = models.Task(
        episode_id=episode.episode_id if episode else None,
        title=rule.task_title,
        description=rule.task_description,
        due_date=due_date,
        status="Pending",
        assigned_officer_id=officer_id, # Assign to supervising officer
        priority=rule.task_priority,
        created_by=officer_id # System/Self assigned
    )
    db.add(new_task)
    return True
