from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime

from .. import models
from ..database import get_db

from pydantic import BaseModel

router = APIRouter(tags=["Fees"])

class FeeTransactionOut(BaseModel):
    transaction_id: UUID
    transaction_date: date
    type: str
    amount: float
    description: Optional[str]

    class Config:
        orm_mode = True

class FeeSummaryOut(BaseModel):
    balance: float
    last_updated: datetime
    history: List[FeeTransactionOut]

@router.get("/fees/{offender_id}", response_model=FeeSummaryOut)
def get_fees_summary(offender_id: UUID, db: Session = Depends(get_db)):
    # Get Balance
    balance_record = db.query(models.FeeBalance).filter(models.FeeBalance.offender_id == offender_id).first()
    current_balance = balance_record.balance if balance_record else 0.0
    last_updated = balance_record.last_updated if balance_record else datetime.utcnow()

    # Get Last 5 Transactions
    transactions = db.query(models.FeeTransaction)\
        .filter(models.FeeTransaction.offender_id == offender_id)\
        .order_by(models.FeeTransaction.transaction_date.desc())\
        .limit(5)\
        .all()

    return {
        "balance": current_balance,
        "last_updated": last_updated,
        "history": transactions
    }
