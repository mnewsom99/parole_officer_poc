from backend.database import engine
from backend import models
import time

print("Dropping all tables...")
# Retry logic in case of locks
for i in range(3):
    try:
        models.Base.metadata.drop_all(bind=engine)
        print("Tables dropped.")
        break
    except Exception as e:
        print(f"Error dropping tables (attempt {i+1}): {e}")
        time.sleep(2)

print("Recreating database schema...")
models.Base.metadata.create_all(bind=engine)
print("Schema created.")
