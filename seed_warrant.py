
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend import models

# Setup DB connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./parole_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def seed_warrant():
    # Find an offender
    offender = db.query(models.Offender).first()
    if not offender:
        print("No offender found.")
        return

    print(f"Seeding warrant for {offender.first_name} {offender.last_name}")
    offender.warrant_status = "Submitted"
    from datetime import date
    offender.warrant_date = date(2025, 12, 9)
    db.commit()
    print("Warrant seeded successfully.")

if __name__ == "__main__":
    seed_warrant()
