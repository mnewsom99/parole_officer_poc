from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
from datetime import datetime

def debug_appointments():
    db = SessionLocal()
    try:
        total_appt = db.query(models.Appointment).count()
        print(f"Total Appointments: {total_appt}")
        
        if total_appt > 0:
            print("\n--- First 5 Appointments ---")
            appts = db.query(models.Appointment).limit(5).all()
            for a in appts:
                print(f"ID: {a.appointment_id}, Date: {a.date_time}, Officer: {a.officer_id}, Status: {a.status}")

            # Check future appointments
            future_count = db.query(models.Appointment).filter(models.Appointment.date_time > datetime.utcnow()).count()
            print(f"\nFuture Appointments: {future_count}")
        else:
            print("WARNING: No appointments found.")
    finally:
        db.close()

if __name__ == "__main__":
    debug_appointments()
