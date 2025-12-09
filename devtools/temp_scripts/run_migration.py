from backend.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print(f"Connected to database: {engine.url}")
        
        commands = [
            "ALTER TABLE offenders ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50)",
            "ALTER TABLE offenders ADD COLUMN IF NOT EXISTS unemployable_reason VARCHAR(50)",
            "ALTER TABLE offenders ADD COLUMN IF NOT EXISTS csed_date DATE",
            "ALTER TABLE offenders ADD COLUMN IF NOT EXISTS housing_status VARCHAR(50)",
            "ALTER TABLE offenders ADD COLUMN IF NOT EXISTS icots_number VARCHAR(50)",
            "ALTER TABLE offenders ADD COLUMN IF NOT EXISTS special_flags TEXT", # JSON in PG context but TEXT is safe fallback or JSONB
            "ALTER TABLE offenders ADD COLUMN IF NOT EXISTS warrant_status VARCHAR(50) DEFAULT 'None'",
            "ALTER TABLE offenders ADD COLUMN IF NOT EXISTS warrant_date DATE"
        ]
        
        # Note: 'IF NOT EXISTS' is supported in Postgres. 
        # SQLite doesn't support IF NOT EXISTS in ADD COLUMN standardly broadly until recently, 
        # so might fail on older SQLite if column exists. 
        # But for Postgres it is fine.
        
        for cmd in commands:
            try:
                # Adjust for SQLite if needed (SQLite doesn't support IF NOT EXISTS in ADD COLUMN in some versions)
                # But since we are targeting Postgres primarily based on error logs...
                # If Postgres, use IF NOT EXISTS.
                
                # Check dialect
                if 'sqlite' in str(engine.url):
                    # SQLite simple approach: try catch
                    cmd_clean = cmd.replace("IF NOT EXISTS ", "")
                    conn.execute(text(cmd_clean))
                else:
                    # Postgres
                     conn.execute(text(cmd))
                     
                print(f"Executed: {cmd}")
            except Exception as e:
                print(f"Skipped/Error {cmd}: {e}")
                
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
