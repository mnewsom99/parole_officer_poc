from backend.database import engine
from sqlalchemy import text

def run_migration():
    print("Starting database migration (SQLite optimized)...")
    with engine.connect() as connection:
        # Create Territories Table
        try:
            # SQLite compatible CREATE TABLE (No UUID defaults)
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS territories (
                    zip_code VARCHAR(10) PRIMARY KEY,
                    assigned_officer_id VARCHAR(36), -- UUID as string
                    region_name VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(assigned_officer_id) REFERENCES officers(officer_id)
                );
            """))
            print("Created territories table (if not exists).")
        except Exception as e:
            print(f"Error creating territories table: {e}")

        # Create Special Assignments Table
        try:
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS special_assignments (
                    assignment_id VARCHAR(36) PRIMARY KEY, -- UUID as string
                    type VARCHAR(50) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    address VARCHAR(255),
                    zip_code VARCHAR(10),
                    assigned_officer_id VARCHAR(36),
                    priority INT DEFAULT 1,
                    FOREIGN KEY(assigned_officer_id) REFERENCES officers(officer_id)
                );
            """))
            print("Created special_assignments table (if not exists).")
        except Exception as e:
            print(f"Error creating special_assignments table: {e}")

        # Alter Residences Table (Add zip_code)
        try:
            connection.execute(text("ALTER TABLE residences ADD COLUMN zip_code VARCHAR(10);"))
            print("Added zip_code to residences.")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "no such table" in str(e).lower(): # Simple check, or ignore
                print(f"Skipping zip_code addition (might exist): {e}")
            else:
                print(f"Error adding zip_code: {e}")

        # Alter Residences Table (Add special_assignment_id)
        try:
            connection.execute(text("ALTER TABLE residences ADD COLUMN special_assignment_id VARCHAR(36) REFERENCES special_assignments(assignment_id);"))
            print("Added special_assignment_id to residences.")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print(f"Skipping special_assignment_id addition (might exist): {e}")
            else:
                 print(f"Error adding special_assignment_id: {e}")


        # Alter Locations Table (Add zip_code)
        try:
            connection.execute(text("ALTER TABLE locations ADD COLUMN zip_code VARCHAR(10);"))
            print("Added zip_code to locations.")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print(f"Skipping zip_code to locations (might exist): {e}")
            else:
                print(f"Error adding zip_code to locations: {e}")
        
        connection.commit()
    print("Migration complete.")

if __name__ == "__main__":
    run_migration()
