
import sqlite3

def migrate():
    conn = sqlite3.connect('parole_app.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE offenders ADD COLUMN employment_status VARCHAR(50)")
        print("Added employment_status column")
    except sqlite3.OperationalError as e:
        print(f"employment_status error: {e}")

    try:
        cursor.execute("ALTER TABLE offenders ADD COLUMN unemployable_reason VARCHAR(50)")
        print("Added unemployable_reason column")
    except sqlite3.OperationalError as e:
        print(f"unemployable_reason error: {e}")

    try:
        cursor.execute("ALTER TABLE offenders ADD COLUMN csed_date DATE")
        print("Added csed_date column")
    except sqlite3.OperationalError as e:
        print(f"csed_date error: {e}")

    try:
        cursor.execute("ALTER TABLE offenders ADD COLUMN housing_status VARCHAR(50)")
        print("Added housing_status column")
    except sqlite3.OperationalError as e:
        print(f"housing_status error: {e}")

    try:
        cursor.execute("ALTER TABLE offenders ADD COLUMN icots_number VARCHAR(50)")
        print("Added icots_number column")
    except sqlite3.OperationalError as e:
        print(f"icots_number error: {e}")

    try:
        cursor.execute("ALTER TABLE offenders ADD COLUMN special_flags TEXT")
        print("Added special_flags column")
    except sqlite3.OperationalError as e:
        print(f"special_flags error: {e}")

    try:
        cursor.execute("ALTER TABLE offenders ADD COLUMN warrant_status VARCHAR(50) DEFAULT 'None'")
        print("Added warrant_status column")
    except sqlite3.OperationalError as e:
        print(f"warrant_status might already exist: {e}")

    try:
        cursor.execute("ALTER TABLE offenders ADD COLUMN warrant_date DATE")
        print("Added warrant_date column")
    except sqlite3.OperationalError as e:
        print(f"warrant_date might already exist: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
