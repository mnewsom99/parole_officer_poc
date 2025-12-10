import sqlite3
import os

db_path = "parole_app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT task_id, title FROM tasks LIMIT 5")
rows = cursor.fetchall()
print(f"Tasks in DB: {len(rows)}")
for r in rows:
    print(r)
conn.close()
