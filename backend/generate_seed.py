from faker import Faker
import random
import uuid
from datetime import datetime, timedelta

fake = Faker()

def generate_insert_statements():
    statements = []
    
    # Generate Roles
    roles = ['Officer', 'Supervisor', 'Admin']
    for i, role in enumerate(roles, 1):
        statements.append(f"INSERT INTO roles (role_id, role_name, description) VALUES ({i}, '{role}', 'Role for {role}');")

    # Generate Locations
    location_ids = []
    for _ in range(5):
        loc_id = str(uuid.uuid4())
        location_ids.append(loc_id)
        name = fake.city() + " Field Office"
        address = fake.address().replace('\n', ', ')
        statements.append(f"INSERT INTO locations (location_id, name, address, type) VALUES ('{loc_id}', '{name}', '{address}', 'Field Office');")

    # Generate Users & Officers
    officer_ids = []
    for _ in range(10):
        user_id = str(uuid.uuid4())
        officer_id = str(uuid.uuid4())
        officer_ids.append(officer_id)
        
        username = fake.user_name()
        email = fake.email()
        first_name = fake.first_name()
        last_name = fake.last_name()
        badge = f"PO-{random.randint(1000, 9999)}"
        
        statements.append(f"INSERT INTO users (user_id, username, email, password_hash, role_id) VALUES ('{user_id}', '{username}', '{email}', 'hash123', 1);")
        statements.append(f"INSERT INTO officers (officer_id, user_id, location_id, badge_number, first_name, last_name) VALUES ('{officer_id}', '{user_id}', '{random.choice(location_ids)}', '{badge}', '{first_name}', '{last_name}');")

    # Generate Offenders & Episodes
    for _ in range(50):
        offender_id = str(uuid.uuid4())
        badge_id = f"DOC-{random.randint(10000, 99999)}"
        first = fake.first_name()
        last = fake.last_name()
        dob = fake.date_of_birth(minimum_age=18, maximum_age=70)
        
        statements.append(f"INSERT INTO offenders (offender_id, badge_id, first_name, last_name, dob) VALUES ('{offender_id}', '{badge_id}', '{first}', '{last}', '{dob}');")
        
        # Episode
        episode_id = str(uuid.uuid4())
        officer_id = random.choice(officer_ids)
        start_date = fake.date_between(start_date='-2y', end_date='today')
        status = random.choice(['Active', 'Active', 'Active', 'Closed'])
        risk = random.choice(['Low', 'Medium', 'High'])
        
        statements.append(f"INSERT INTO supervision_episodes (episode_id, offender_id, assigned_officer_id, start_date, status, risk_level_at_start) VALUES ('{episode_id}', '{offender_id}', '{officer_id}', '{start_date}', '{status}', '{risk}');")

    return statements

if __name__ == "__main__":
    inserts = generate_insert_statements()
    with open("database/seed.sql", "w") as f:
        f.write("\n".join(inserts))
    print(f"Generated {len(inserts)} insert statements in database/seed.sql")
