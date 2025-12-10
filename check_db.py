import sqlite3
import os

db_path = "parole_app.db"

if not os.path.exists(db_path):
    print("Database file NOT FOUND")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT count(*) FROM tasks")
        task_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT count(*) FROM appointments")
        appt_count = cursor.fetchone()[0]
        
        print(f"Tasks: {task_count}")
        print(f"Appointments: {appt_count}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
