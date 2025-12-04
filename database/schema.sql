-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles Table
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(role_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Locations Table
CREATE TABLE locations (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL
);

-- Officers Table
CREATE TABLE officers (
    officer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    location_id UUID REFERENCES locations(location_id),
    supervisor_id UUID REFERENCES officers(officer_id),
    badge_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20)
);

-- Offenders Table
CREATE TABLE offenders (
    offender_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    dob DATE NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SupervisionEpisodes Table
CREATE TABLE supervision_episodes (
    episode_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offender_id UUID REFERENCES offenders(offender_id),
    assigned_officer_id UUID REFERENCES officers(officer_id),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL,
    risk_level_at_start VARCHAR(20) NOT NULL,
    closing_reason VARCHAR(100)
);

-- Residences Table
CREATE TABLE residences (
    residence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID REFERENCES supervision_episodes(episode_id),
    address_line_1 VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    host_name VARCHAR(100),
    relationship_type VARCHAR(50),
    approval_status VARCHAR(50) DEFAULT 'Pending',
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE
);

-- CustodyEvents Table
CREATE TABLE custody_events (
    custody_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID REFERENCES supervision_episodes(episode_id),
    booking_date TIMESTAMP NOT NULL,
    release_date TIMESTAMP,
    facility_name VARCHAR(100) NOT NULL,
    reason VARCHAR(100) NOT NULL
);

-- Tasks Table
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID REFERENCES supervision_episodes(episode_id),
    created_by UUID REFERENCES officers(officer_id),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notes Table
CREATE TABLE notes (
    note_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID REFERENCES supervision_episodes(episode_id),
    author_id UUID REFERENCES officers(officer_id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessments Table
CREATE TABLE assessments (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID REFERENCES supervision_episodes(episode_id),
    type VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    risk_level_result VARCHAR(20) NOT NULL,
    details JSONB,
    completed_date DATE NOT NULL,
    completed_by UUID REFERENCES officers(officer_id)
);

-- Vendors Table
CREATE TABLE vendors (
    vendor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    contact_email VARCHAR(100),
    api_endpoint VARCHAR(255),
    api_key_ref VARCHAR(255)
);

-- Events Table
CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID REFERENCES supervision_episodes(episode_id),
    officer_id UUID REFERENCES officers(officer_id),
    vendor_id UUID REFERENCES vendors(vendor_id),
    type VARCHAR(50) NOT NULL,
    scheduled_time TIMESTAMP NOT NULL,
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Scheduled',
    outcome_notes TEXT
);
