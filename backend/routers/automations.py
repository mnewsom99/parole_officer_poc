from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..database import get_db
from ..models import AutomationRule
from .. import schemas

router = APIRouter(
    prefix="/automations/rules",
    tags=["automations"],
)

@router.get("/", response_model=List[schemas.AutomationRule])
def get_rules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    rules = db.query(AutomationRule).offset(skip).limit(limit).all()
    return rules

@router.post("/", response_model=schemas.AutomationRule)
def create_rule(rule: schemas.AutomationRuleCreate, db: Session = Depends(get_db)):
    db_rule = AutomationRule(**rule.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/{rule_id}", response_model=schemas.AutomationRule)
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    db_rule = db.query(AutomationRule).filter(AutomationRule.rule_id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(db_rule)
    db.commit()
    return db_rule
