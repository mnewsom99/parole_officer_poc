from backend.database import SessionLocal
from backend import models

def check_db():
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        officers = db.query(models.Officer).all()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f" - {u.username} (RoleID: {u.role_id})")

        print(f"\nTotal Officers: {len(officers)}")
        for o in officers:
            print(f" - {o.first_name} {o.last_name} (ID: {o.officer_id}) (Loc: {o.location_id})")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
