
import os
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

# Load env manually to avoid dependency issues if python-dotenv not installed/working in this specific context context
# But since we are verifying the app environment, we should assume it is there. 
# However, to be safe and fast:
DB_URL = "postgresql://user:password@localhost:5432/parole_db"

def check_db():
    print(f"Connecting to {DB_URL}...")
    engine = create_engine(DB_URL)
    try:
        # Try to connect
        with engine.connect() as connection:
            print("Successfully connected to the PostgreSQL database!")
            return True
    except OperationalError as e:
        print(f"Connection failed: {e}")
        return False
    except Exception as e:
        print(f"An error occurred: {e}")
        return False

if __name__ == "__main__":
    # Retry logic
    for i in range(5):
        if check_db():
            break
        print("Retrying in 2 seconds...")
        time.sleep(2)
