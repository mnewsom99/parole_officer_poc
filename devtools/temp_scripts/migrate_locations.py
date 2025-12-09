from backend.database import engine
from sqlalchemy import text

def run_migration():
    print("Starting locations enhancement migration...")
    with engine.connect() as connection:
        # Add phone to locations
        try:
            connection.execute(text("ALTER TABLE locations ADD COLUMN phone VARCHAR(20);"))
            print("Added phone to locations.")
        except Exception as e:
            if "duplicate column" in str(e).lower(): print("Phone column already exists.")
            else: print(f"Error adding phone: {e}")

        # Add fax to locations
        try:
            connection.execute(text("ALTER TABLE locations ADD COLUMN fax VARCHAR(20);"))
            print("Added fax to locations.")
        except Exception as e:
            if "duplicate column" in str(e).lower(): print("Fax column already exists.")
            else: print(f"Error adding fax: {e}")

        # Add assigned_location_id to territories
        try:
            connection.execute(text("ALTER TABLE territories ADD COLUMN assigned_location_id VARCHAR(36) REFERENCES locations(location_id);"))
            print("Added assigned_location_id to territories.")
        except Exception as e:
            if "duplicate column" in str(e).lower(): print("Assigned_location_id column already exists.")
            else: print(f"Error adding assigned_location_id: {e}")

        connection.commit()
    print("Migration complete.")

if __name__ == "__main__":
    run_migration()
