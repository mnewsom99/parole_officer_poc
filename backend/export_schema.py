import json
from sqlalchemy.inspection import inspect
from . import models

# Metadata mapping for rich schema documentation
SCHEMA_METADATA = {
    "roles": {
        "description": "Defines user roles and permissions.",
        "context": "Core RBAC functionality",
        "usage": "Login, Admin Panel, User Management"
    },
    "users": {
        "description": "System users (Officers, Admins, Supervisors).",
        "context": "Authentication and Identity",
        "usage": "Login, Profile, User Management"
    },
    "locations": {
        "description": "Physical office locations (Field Offices, HQ).",
        "context": "Organizational hierarchy and resource allocation",
        "usage": "Office Locations, Dashboard, Territory Management"
    },
    "officers": {
        "description": " sworn personnel details linked to Users.",
        "context": "Links auth User to distinct Officer entity with badge/caseload",
        "usage": "Dashboard, Case Load, Assignments"
    },
    "offenders": {
        "description": "Core entity for individuals under supervision.",
        "context": "Central record for all supervision activities",
        "usage": "All Pages (Caseload, Profile, Search)"
    },
    "supervision_episodes": {
        "description": "Tracks specific periods of supervision (Assignments).",
        "context": "Allows history of supervision (Active vs Closed)",
        "usage": "Offender Profile, Dashboard Stats"
    },
    "tasks": {
        "description": "Action items and compliance tasks.",
        "context": "Workflow management for officers",
        "usage": "Dashboard, Offender Profile"
    },
    "territories": {
        "description": "Geographic assignments by Zip Code.",
        "context": "Enables auto-assignment of incoming cases",
        "usage": "Territory Management"
    },
    "territory_officers": {
        "description": "Association table for Territory <-> Officer.",
        "context": "Supports multiple officers sharing a single zip code coverage",
        "usage": "Territory Management"
    },
    "special_assignments": {
        "description": "Overrides for non-geographic assignments (Facilities, Specialties).",
        "context": "Handles cases like SMI or Residential Facilities that bypass Zip rules",
        "usage": "Territory Management"
    },
    "residences": {
        "description": "Address history for offenders.",
        "context": "Tracks current and past locations for geo-matching",
        "usage": "Offender Profile"
    },
    "case_notes": {
        "description": "Chronological record of interactions.",
        "context": "Legal record of supervision",
        "usage": "Offender Profile (Notes Tab)"
    }
    # Add others as needed
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
        models.CaseNote
    ]
    
    for model in model_classes:
        table_name = model.__tablename__
        mapper = inspect(model)
        
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
                "key": key_type
            })
        
        meta = SCHEMA_METADATA.get(table_name, {})
        
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
