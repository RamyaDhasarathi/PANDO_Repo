INTERACTION_EVENT_TYPES = [
    "PROPERTY_SHOWN",
    "PROPERTY_CLICKED",
    "PROPERTY_VIEWED",
    "PROPERTY_SAVED",
    "PROPERTY_SHORTLISTED",
    "PROPERTY_REJECTED",
    "BROKER_CONTACTED",
    "VIEWING_REQUESTED",
]

INTERACTION_EVENT_JSON_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["userId", "propertyId", "event", "timestamp"],
        "properties": {
            "userId": {"bsonType": "string"},
            "propertyId": {"bsonType": "string"},
            "event": {"bsonType": "string", "enum": INTERACTION_EVENT_TYPES},
            "timestamp": {"bsonType": "date"},
            "recommendationScore": {
                "bsonType": ["double", "int", "null"],
                "minimum": 0,
                "maximum": 1,
            },
            # userDna/matchScores are snapshots taken at PROPERTY_SHOWN time (Phase 3.2 needs
            # them to build training rows). Deliberately untyped here beyond "object" — their
            # detailed shape is validated at the Pydantic layer (UserDNA), not duplicated here.
            "userDna": {"bsonType": ["object", "null"]},
            "matchScores": {"bsonType": ["object", "null"]},
        },
    }
}
