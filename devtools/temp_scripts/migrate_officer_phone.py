
from backend.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as connection:
        try:
            connection.execute(text("ALTER TABLE officers ADD COLUMN cell_phone VARCHAR(50);"))
            connection.commit()
            print("Migration successful: Added cell_phone to officers table.")
        except Exception as e:
            print(f"Migration failed (might already exist): {e}")

if __name__ == "__main__":
    run_migration()
