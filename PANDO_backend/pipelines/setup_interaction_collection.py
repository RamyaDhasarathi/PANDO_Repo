from pymongo.errors import CollectionInvalid

from api.db import get_db
from pipelines.schemas.interaction_mongo_schema import INTERACTION_EVENT_JSON_SCHEMA

COLLECTION_NAME = "hi_pando_interactions"


def main():
    db = get_db()

    try:
        db.create_collection(
            COLLECTION_NAME,
            validator=INTERACTION_EVENT_JSON_SCHEMA,
            validationLevel="strict",
            validationAction="error",
        )
        print(f"Created collection '{COLLECTION_NAME}' with schema validation.")
    except CollectionInvalid:
        db.command(
            "collMod",
            COLLECTION_NAME,
            validator=INTERACTION_EVENT_JSON_SCHEMA,
            validationLevel="strict",
            validationAction="error",
        )
        print(f"Collection '{COLLECTION_NAME}' already existed — updated its validator.")

    # Events are append-only and queried by user, by property, and chronologically —
    # no unique index (a user may interact with the same property multiple times).
    db[COLLECTION_NAME].create_index("userId")
    db[COLLECTION_NAME].create_index("propertyId")
    db[COLLECTION_NAME].create_index("timestamp")
    print("Ensured indexes on 'userId', 'propertyId', 'timestamp'.")


if __name__ == "__main__":
    main()
