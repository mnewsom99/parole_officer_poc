import json
from sqlalchemy.inspection import inspect
from . import models

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
        models.Task
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
            
        schema_data[table_name] = {
            "description": f"Table for {table_name}", # Could be enhanced with docstrings
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
