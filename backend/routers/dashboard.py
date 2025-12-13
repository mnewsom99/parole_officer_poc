from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    officer_id: str = None, # Optional filter
    location_id: str = None, # Optional filter
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Determine effective filters
    # If parameters are passed, use them (Admin/Manager overrides).
    # If no parameters, default to current user's view if they are an officer.
    
    # Check if current user is an officer
    current_officer = db.query(models.Officer).filter(models.Officer.user_id == current_user.user_id).first()
    
    # Logic: 
    # 1. If officer_id param is set, filter by that.
    # 2. If location_id param is set, filter by that.
    # 3. If NEITHER is set, and user is an Officer (not just Admin), default to THEIR caseload.
    #    (Unless we want a "System View" by default for empty filters? The UI sends empty string for "All")
    
    target_officer_id = officer_id
    target_location_id = location_id
    
    # If no filters provided and user is an officer, assume "My Caseload" (default behavior)
    # But if the UI explicitly sends empty strings for "All", we should respect that.
    # The UI sends "" for "All". FastAPI treats empty string as None if type is Optional[str] = None? No, simpler to handle manually.
    
    # If no filters provided, default to showing ALL data for everyone (as requested).
    # We do NOT force "My Caseload" for officers anymore.
    # Security note: This allows any authenticated user to see aggregate system stats.
    
    if target_officer_id == "": target_officer_id = None
    if target_location_id == "": target_location_id = None
    
    print(f"DEBUG_DASHBOARD: User='{current_user.username}' Fetching stats. OfficerFilter='{target_officer_id}' LocationFilter='{target_location_id}'")

    # 2. Total Caseload (Active Episodes)
    # We query SupervisionEpisodes. 
    # To filter by location, we need to join Officers (assigned_officer) -> Location? 
    # Or Offender -> Location? Usually specific to the Officer's location or the Territory.
    # Let's assume Location filter applies to the Assigned Officer's location.
    
    query = db.query(models.SupervisionEpisode).filter(models.SupervisionEpisode.status == 'Active')
    
    if target_officer_id:
        query = query.filter(models.SupervisionEpisode.assigned_officer_id == target_officer_id)
    
    if target_location_id:
        query = query.join(models.Officer).filter(models.Officer.location_id == target_location_id)
    
    total_caseload = query.count()
    active_offenders = total_caseload

    # 3. Employment Rate
    # Calculate % of ACTIVE caseload that is employed.
    # We need to join Offender to check employment_status.
    employment_query = db.query(models.Offender).join(models.SupervisionEpisode).filter(
        models.SupervisionEpisode.status == 'Active'
    )
    
    if target_officer_id:
        employment_query = employment_query.filter(models.SupervisionEpisode.assigned_officer_id == target_officer_id)
    
    if target_location_id:
        # Join Officer on Episode to check location
        employment_query = employment_query.join(models.Officer, models.SupervisionEpisode.assigned_officer_id == models.Officer.officer_id).filter(models.Officer.location_id == target_location_id)
        
    # Count employed
    # Assuming 'Employed' or 'Part-time' etc. Let's check typical values. usually 'Employed'.
    # Filtering case-insensitive or exact 'Employed'
    employed_count = employment_query.filter(models.Offender.employment_status == 'Employed').count()
    
    if total_caseload > 0:
        employment_rate = round((employed_count / total_caseload) * 100, 1)
    else:
        employment_rate = 0.0

    # 4. Warrants Issued (Active/Pinned Violations)
    warrants_query = db.query(models.CaseNote).filter(
        models.CaseNote.type == 'Violation',
        models.CaseNote.is_pinned == True
    )
    # Join path: CaseNote -> Offender -> SupervisionEpisode -> Officer
    warrants_query = warrants_query.join(models.Offender).join(models.SupervisionEpisode).filter(
        models.SupervisionEpisode.status == 'Active'
    )
    
    if target_officer_id:
        warrants_query = warrants_query.filter(models.SupervisionEpisode.assigned_officer_id == target_officer_id)
        
    if target_location_id:
        warrants_query = warrants_query.join(models.Officer, models.SupervisionEpisode.assigned_officer_id == models.Officer.officer_id).filter(models.Officer.location_id == target_location_id)
    
    warrants_issued = warrants_query.count()

    # 5. Compliance Rate
    if total_caseload > 0:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        violators_query = db.query(models.CaseNote.offender_id).filter(
            models.CaseNote.type == 'Violation',
            models.CaseNote.date >= thirty_days_ago
        )
        
        violators_query = violators_query.join(models.Offender).join(models.SupervisionEpisode).filter(
            models.SupervisionEpisode.status == 'Active'
        )
        
        if target_officer_id:
           violators_query = violators_query.filter(models.SupervisionEpisode.assigned_officer_id == target_officer_id)
           
        if target_location_id:
            violators_query = violators_query.join(models.Officer, models.SupervisionEpisode.assigned_officer_id == models.Officer.officer_id).filter(models.Officer.location_id == target_location_id)
        
        violator_count = violators_query.distinct().count()
        compliant_count = total_caseload - violator_count
        compliance_rate = round((compliant_count / total_caseload) * 100, 1)
    else:
        compliance_rate = 100.0

    # 6. Pending Reviews
    pending_query = db.query(models.Task).filter(models.Task.status == 'Pending')
    pending_query = pending_query.join(models.SupervisionEpisode) # Ensure linked to active work? Not necessarily, but for filters yes.
    
    if target_officer_id:
        pending_query = pending_query.filter(models.SupervisionEpisode.assigned_officer_id == target_officer_id)
        
    if target_location_id:
        pending_query = pending_query.join(models.Officer, models.SupervisionEpisode.assigned_officer_id == models.Officer.officer_id).filter(models.Officer.location_id == target_location_id)
        
    pending_reviews = pending_query.count()

    # 7. Risk Distribution
    risk_query = db.query(
        models.SupervisionEpisode.risk_level_at_start,
        func.count(models.SupervisionEpisode.risk_level_at_start)
    ).filter(models.SupervisionEpisode.status == 'Active')
    
    if target_officer_id:
        risk_query = risk_query.filter(models.SupervisionEpisode.assigned_officer_id == target_officer_id)
        
    if target_location_id:
        risk_query = risk_query.join(models.Officer, models.SupervisionEpisode.assigned_officer_id == models.Officer.officer_id).filter(models.Officer.location_id == target_location_id)
    
    risk_counts = risk_query.group_by(models.SupervisionEpisode.risk_level_at_start).all()
    
    # Format for frontend
    levels = {
        "Low": {"value": 0, "color": "#22c55e"},   # Green-500
        "Medium": {"value": 0, "color": "#eab308"}, # Yellow-500
        "High": {"value": 0, "color": "#ef4444"}    # Red-500
    }

    for risk_level, count in risk_counts:
        # Normalize keys (Low Risk -> Low)
        key = risk_level
        if "Low" in risk_level: key = "Low"
        elif "Medium" in risk_level or "Moderate" in risk_level: key = "Medium"
        elif "High" in risk_level: key = "High"
        
        if key in levels:
            levels[key]["value"] += count # Add, in case of slight string variations mapping to same bucket
    
    risk_distribution = [
        schemas.RiskDistributionItem(name=k, value=v["value"], color=v["color"])
        for k, v in levels.items()
    ]

    return schemas.DashboardStats(
        total_caseload=total_caseload,
        active_offenders=active_offenders,
        compliance_rate=compliance_rate,
        employment_rate=employment_rate,
        pending_reviews=pending_reviews,
        warrants_issued=warrants_issued,
        risk_distribution=risk_distribution
    )
