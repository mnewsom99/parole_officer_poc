from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Get Current Officer ID associated with the user
    officer = db.query(models.Officer).filter(models.Officer.user_id == current_user.user_id).first()
    officer_id = officer.officer_id if officer else None

    # 2. Total Caseload (Active Episodes)
    query = db.query(models.SupervisionEpisode).filter(models.SupervisionEpisode.status == 'Active')
    if officer_id:
        query = query.filter(models.SupervisionEpisode.assigned_officer_id == officer_id)
    
    total_caseload = query.count()
    active_offenders = total_caseload

    # 3. Warrants Issued (Active/Pinned Violations)
    warrants_query = db.query(models.CaseNote).filter(
        models.CaseNote.type == 'Violation',
        models.CaseNote.is_pinned == True
    )
    if officer_id:
        warrants_query = warrants_query.join(models.Offender).join(models.SupervisionEpisode).filter(
            models.SupervisionEpisode.status == 'Active',
            models.SupervisionEpisode.assigned_officer_id == officer_id
        )
    
    warrants_issued = warrants_query.count()

    # 4. Compliance Rate
    if total_caseload > 0:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        violators_query = db.query(models.CaseNote.offender_id).filter(
            models.CaseNote.type == 'Violation',
            models.CaseNote.date >= thirty_days_ago
        )
        if officer_id:
           violators_query = violators_query.join(models.Offender).join(models.SupervisionEpisode).filter(
                models.SupervisionEpisode.status == 'Active',
                models.SupervisionEpisode.assigned_officer_id == officer_id
            )
        
        violator_count = violators_query.distinct().count()
        compliant_count = total_caseload - violator_count
        compliance_rate = round((compliant_count / total_caseload) * 100, 1)
    else:
        compliance_rate = 100.0

    # 5. Pending Reviews
    pending_query = db.query(models.Task).filter(models.Task.status == 'Pending')
    if officer_id:
        pending_query = pending_query.join(models.SupervisionEpisode).filter(
            models.SupervisionEpisode.assigned_officer_id == officer_id
        )
    pending_reviews = pending_query.count()

    # 6. Risk Distribution
    # Count Active Episodes by Risk Level
    risk_query = db.query(
        models.SupervisionEpisode.risk_level_at_start,
        func.count(models.SupervisionEpisode.risk_level_at_start)
    ).filter(models.SupervisionEpisode.status == 'Active')

    if officer_id:
        risk_query = risk_query.filter(models.SupervisionEpisode.assigned_officer_id == officer_id)
    
    risk_counts = risk_query.group_by(models.SupervisionEpisode.risk_level_at_start).all()
    
    # Format for frontend
    # Ensure all levels present
    levels = {
        "Low": {"value": 0, "color": "#22c55e"},   # Green-500
        "Medium": {"value": 0, "color": "#eab308"}, # Yellow-500
        "High": {"value": 0, "color": "#ef4444"}    # Red-500
    }

    for risk_level, count in risk_counts:
        rs = risk_level.capitalize() if risk_level else "Unknown"
        if rs in levels:
            levels[rs]["value"] = count
    
    risk_distribution = [
        schemas.RiskDistributionItem(name=k, value=v["value"], color=v["color"])
        for k, v in levels.items()
    ]

    return schemas.DashboardStats(
        total_caseload=total_caseload,
        active_offenders=active_offenders,
        compliance_rate=compliance_rate,
        pending_reviews=pending_reviews,
        warrants_issued=warrants_issued,
        risk_distribution=risk_distribution
    )
