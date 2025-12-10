from backend.database import SessionLocal
from backend.automation import run_daily_automations

if __name__ == "__main__":
    db = SessionLocal()
    try:
        run_daily_automations(db)
    finally:
        db.close()
