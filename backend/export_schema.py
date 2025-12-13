import json
from sqlalchemy.inspection import inspect
from . import models

# Metadata mapping for rich schema documentation
SCHEMA_METADATA = {
    "roles": {
        "description": "Defines user roles and permissions.",
        "context": "Core RBAC functionality",
        "usage": "Login, Admin Panel, User Management",
        "fields": {
            "role_id": "Primary Key",
            "role_name": "Unique identifier for the role",
            "description": "Human-readable description of permissions"
        }
    },
    "users": {
        "description": "System users (Officers, Admins, Supervisors).",
        "context": "Authentication and Identity",
        "usage": "Login, Profile, User Management",
        "fields": {
            "user_id": "Unique UUID for the user",
            "username": "Login credential",
            "email": "Contact and recovery email",
            "password_hash": "Bcrypt hashed password",
            "role_id": "Link to authorization role",
            "created_at": "Account creation timestamp",
            "last_login": "Audit timestamp of last access",
            "is_active": "Soft delete flag"
        }
    },
    "locations": {
        "description": "Physical office locations (Field Offices, HQ).",
        "context": "Organizational hierarchy and resource allocation",
        "usage": "Office Locations, Dashboard, Territory Management",
        "fields": {
            "location_id": "Unique UUID",
            "name": "Public display name of office",
            "address": "Physical street address",
            "type": "Classification (Field Office, HQ, Satellite)",
            "zip_code": "Postal code for territory mapping",
            "phone": "Main contact line",
            "fax": "Secure fax line for legal docs"
        }
    },
    "officers": {
        "description": "Sworn personnel details linked to Users.",
        "context": "Links auth User to distinct Officer entity with badge/caseload",
        "usage": "Dashboard, Case Load, Assignments",
        "fields": {
            "officer_id": "Unique UUID",
            "user_id": "Link to User account (Auth)",
            "location_id": "Assigned base office",
            "supervisor_id": "Reporting line manager",
            "badge_number": "Official unique badge ID",
            "first_name": "Officer first name",
            "last_name": "Officer last name",
            "phone_number": "Work desk phone",
            "cell_phone": "Work mobile for field use"
        }
    },
    "offenders": {
        "description": "Core entity for individuals under supervision.",
        "context": "Central record for all supervision activities",
        "usage": "All Pages (Caseload, Profile, Search)",
        "fields": {
            "offender_id": "Unique UUID",
            "badge_id": "Unique internal identifier (DOC #)",
            "first_name": "Legal first name",
            "last_name": "Legal last name",
            "dob": "Date of Birth",
            "image_url": "Profile mugshot URL",
            "phone": "Primary contact number",
            "gender": "Self-identified gender",
            "gang_affiliation": "Known security threat group",
            "release_date": "Date of release from custody",
            "reversion_date": "Date returned to custody (if revoked)",
            "release_type": "Parole, Probation, etc.",
            "initial_placement": "First assigned location upon release",
            "csed_date": "Community Supervision End Date (Max Expiration)",
            "special_flags": "JSON array of risk indicators (SMI, etc)",
            "housing_status": "Current stabilitiy indicator",
            "icots_number": "Interstate Compact ID",
            "employment_status": "Work status for stats",
            "unemployable_reason": "Justification if not working",
            "warrant_status": "Active warrant state",
            "warrant_date": "Date warrant issued/requested",
            "general_comments": "High level case summary",
            "created_at": "Record creation date"
        }
    },
    "supervision_episodes": {
        "description": "Tracks specific periods of supervision (Assignments).",
        "context": "Allows history of supervision (Active vs Closed)",
        "usage": "Offender Profile, Dashboard Stats",
        "fields": {
            "episode_id": "Unique UUID",
            "offender_id": "Link to Offender",
            "assigned_officer_id": "Officer responsible for this period",
            "start_date": "Date supervision began",
            "end_date": "Date supervision ended (if closed)",
            "status": "Active or Closed",
            "risk_level_at_start": "Initial risk assessment",
            "current_risk_level": "Updated dynamic risk",
            "closing_reason": "Reason for termination (Success, Revocation)"
        }
    },
    "tasks": {
        "description": "Action items and compliance tasks.",
        "context": "Workflow management for officers",
        "usage": "Dashboard, Offender Profile",
        "fields": {
            "task_id": "Unique UUID",
            "episode_id": "Link to supervision period",
            "offender_id": "Direct link for query optimization",
            "created_by": "Officer who assigned the task",
            "assigned_officer_id": "Officer responsible for completion",
            "title": "Short summary",
            "description": "Detailed instructions",
            "category": "Task grouping (Visit, Admin, Court)",
            "sub_category": "Specific type",
            "due_date": "Deadline",
            "status": "Workflow state (Pending, Done)",
            "is_parole_plan": "Fulfills a release condition",
            "created_at": "Timestamp",
            "updated_at": "Last modification"
        }
    },
    "territories": {
        "description": "Geographic assignments by Zip Code.",
        "context": "Enables auto-assignment of incoming cases",
        "usage": "Territory Management",
        "fields": {
            "zip_code": "Postal code (PK)",
            "assigned_location_id": "Default office for this area",
            "region_name": "Descriptive region label",
            "created_at": "Assignment date"
        }
    },
    "territory_officers": {
        "description": "Association table for Territory <-> Officer.",
        "context": "Supports multiple officers sharing a single zip code coverage",
        "usage": "Territory Management",
        "fields": {
            "zip_code": "Territory link",
            "officer_id": "Officer link",
            "is_primary": "Flag for main point of contact"
        }
    },
    "special_assignments": {
        "description": "Overrides for non-geographic assignments (Facilities, Specialties).",
        "context": "Handles cases like SMI or Residential Facilities that bypass Zip rules",
        "usage": "Territory Management",
        "fields": {
            "assignment_id": "Unique UUID",
            "type": "Facility, Specialty, or Admin",
            "name": "Label for the assignment",
            "address": "Physical location if Facility",
            "zip_code": "Override zip if applicable",
            "assigned_officer_id": "Officer handling this caseload",
            "priority": "Processing weight"
        }
    },
    "residences": {
        "description": "Address history for offenders.",
        "context": "Tracks current and past locations for geo-matching",
        "usage": "Offender Profile",
        "fields": {
            "residence_id": "Unique UUID",
            "episode_id": "Link to supervision",
            "address_line_1": "Street address",
            "city": "City",
            "state": "State",
            "zip_code": "Zip for territory matching",
            "start_date": "Move-in date",
            "end_date": "Move-out date",
            "housing_type": "Classification (House, Apt, Homeless)",
            "is_current": "Active residence flag",
            "special_assignment_id": "Link if housing is a covered facility"
        }
    },
    "programs": {
        "description": "Rehabilitation programs assigned to offenders.",
        "context": "Tracks progress and completion of mandated programs",
        "usage": "Offender Profile",
        "fields": {
            "program_id": "Unique UUID",
            "offender_id": "Link to Offender",
            "name": "Program Title",
            "category": "Type (Counseling, Rehab)",
            "provider": "External agency name",
            "status": "Completion state",
            "start_date": "Enrollment date",
            "end_date": "Completion/Drop date",
            "notes": "Progress notes"
        }
    },
    "fee_balances": {
        "description": "Current outstanding balance for offenders.",
        "context": "Financial tracking",
        "usage": "Offender Profile (Financials)",
        "fields": {
            "offender_id": "Link to Offender",
            "balance": "Total amount owed",
            "last_updated": "Timestamp of last calculation"
        }
    },
    "fee_transactions": {
        "description": "Ledger of financial charges and payments.",
        "context": "Audit trail for fees",
        "usage": "Offender Profile (Financials)",
        "fields": {
            "transaction_id": "Unique UUID",
            "offender_id": "Link to Offender",
            "transaction_date": "Date of activity",
            "type": "Charge or Payment",
            "amount": "Monetary value",
            "description": "Reason for charge/payment"
        }
    },
    "urinalysis": {
        "description": "Drug test records.",
        "context": "Compliance monitoring",
        "usage": "Offender Profile, Lab Reports",
        "fields": {
            "test_id": "Unique UUID",
            "offender_id": "Link to Offender",
            "date": "Collection date",
            "test_type": "Random or Scheduled",
            "result": "Lab outcome",
            "lab_name": "Testing vendor",
            "collected_by_id": "Officer witness",
            "notes": "Chain of custody notes"
        }
    },
    "risk_assessment_types": {
        "description": "Definitions of available risk tools (ORAS, etc).",
        "context": "Configuration for risk scoring logic",
        "usage": "Risk Settings",
        "fields": {
            "type_id": "Integer ID",
            "name": "Tool Name (e.g. ORAS)",
            "description": "Usage guidelines",
            "scoring_matrix": "JSON logic for score calculation"
        }
    },
    "risk_assessments": {
        "description": "Completed risk assessments for offenders.",
        "context": "Determines supervision level",
        "usage": "Offender Profile (Risk)",
        "fields": {
            "assessment_id": "Unique UUID",
            "offender_id": "Link to Offender",
            "date": "Date conducted",
            "assessment_type": "Tool used (ORAS, etc)",
            "status": "Draft or Finalized",
            "total_score": "Computed numeric score",
            "risk_level": "Algorithmically determined level",
            "final_risk_level": "Applied level after overrides",
            "override_reason": "Justification for override",
            "details": "JSON snapshot of factors"
        }
    },
    "appointments": {
        "description": "Scheduled meetings between officers and offenders.",
        "context": "Calendar management",
        "usage": "Calendar, Offender Profile",
        "fields": {
            "appointment_id": "Unique UUID",
            "offender_id": "Link to Offender",
            "officer_id": "Hosting Officer",
            "date_time": "Scheduled time",
            "location": "Meeting place",
            "type": "Reason (Office Visit, Home Visit)",
            "status": "Outcome (Completed, No Show)",
            "notes": "Meeting summary"
        }
    },
    "system_settings": {
        "description": "Global application configuration.",
        "context": "Key-value store for app behavior",
        "usage": "System Configuration",
        "fields": {
            "key": "Setting Identifier",
            "value": "Configuration Value",
            "description": "Explanation of setting effect"
        }
    }
}

def export_schema():
    schema_data = {}
    
    # List of models to inspect
    model_classes = [
        models.Role,
        models.User,
        models.Location,
        models.Officer,
        models.Offender,
        models.SupervisionEpisode,
        models.Task,
        models.Territory,
        models.TerritoryOfficer,
        models.SpecialAssignment,
        models.Residence,
        models.CaseNote,
        models.Program,
        models.FeeBalance,
        models.FeeTransaction,
        models.ResidenceContact,
        models.Urinalysis,
        models.RiskAssessmentType,
        models.RiskAssessmentQuestion,
        models.RiskAssessment,
        models.RiskAssessmentAnswer,
        models.Appointment,
        models.SystemSettings,
        models.FormTemplate,
        models.FormSubmission,
        models.WorkflowLog
    ]
    
    for model in model_classes:
        table_name = model.__tablename__
        mapper = inspect(model)
        
        # Get metadata for this table
        meta = SCHEMA_METADATA.get(table_name, {})
        field_meta = meta.get("fields", {})
        
        fields = []
        for column in mapper.columns:
            # Determine key type
            key_type = ""
            if column.primary_key:
                key_type = "PK"
            elif column.foreign_keys:
                key_type = "FK"
            elif column.unique:
                key_type = "Unique"
                
            fields.append({
                "name": column.name,
                "type": str(column.type),
                "key": key_type,
                "description": field_meta.get(column.name, "") # Add description lookup
            })
        
        schema_data[table_name] = {
            "description": meta.get("description", f"Table for {table_name}"),
            "context": meta.get("context", "General data storage"),
            "usage": meta.get("usage", "Backend API"),
            "fields": fields
        }
        
    output_path = "src/data/schema.json"
    # Ensure directory exists
    import os
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(schema_data, f, indent=4)
        
    print(f"Schema exported to {output_path}")

if __name__ == "__main__":
    export_schema()
