from backend.database import SessionLocal, engine
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        print("Starting Territory Officers Migration...")
        
        # 1. Create table if not exists
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS territory_officers (
            zip_code VARCHAR(10),
            officer_id CHAR(36),
            is_primary BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (zip_code, officer_id),
            FOREIGN KEY (zip_code) REFERENCES territories(zip_code) ON DELETE CASCADE,
            FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE
        );
        """
        db.execute(text(create_table_sql))
        db.commit()
        print("Table 'territory_officers' created.")

        # 2. Migrate existing data
        # We need to act carefully if the column exists.  sqlite doesn't support IF EXISTS on column select easily in raw sql without checking schema table.
        # But we know the schema state.
        
        # Select existing assignments
        try:
            result = db.execute(text("SELECT zip_code, assigned_officer_id FROM territories WHERE assigned_officer_id IS NOT NULL"))
            assignments = result.fetchall()
            
            for row in assignments:
                zip_code = row[0]
                officer_id = row[1]
                
                # Insert into new table
                db.execute(text("INSERT OR IGNORE INTO territory_officers (zip_code, officer_id, is_primary) VALUES (:z, :o, :p)"), 
                           {"z": zip_code, "o": officer_id, "p": True})
            
            db.commit()
            print(f"Migrated {len(assignments)} assignments.")
            
        except Exception as e:
            print(f"Migration step failed (maybe column already dropped?): {e}")

        # 3. Drop column from territories (SQLite doesn't support DROP COLUMN easily in older versions, but we can ignore it or set to null)
        # Typically in SQLite we have to recreate the table, but for this POC we can just stop using the column.
        # We will update the SQLAlchemy model to ignore it.
        # However, to be clean, let's try to set them to NULL to indicate deprecated.
        try:
           db.execute(text("UPDATE territories SET assigned_officer_id = NULL"))
           db.commit()
           print("Cleared old assigned_officer_id column.")
        except Exception as e:
            print(f"Cleanup failed: {e}")

    except Exception as e:
        print(f"Error migrating: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
