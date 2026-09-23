from pymongo.errors import CollectionInvalid

from api.db import get_db
from pipelines.schemas.property_mongo_schema import PROPERTY_JSON_SCHEMA

COLLECTION_NAME = "hi_pando_properties"


def main():
    db = get_db()

    try:
        db.create_collection(
            COLLECTION_NAME,
            validator=PROPERTY_JSON_SCHEMA,
            validationLevel="strict",
            validationAction="error",
        )
        print(f"Created collection '{COLLECTION_NAME}' with schema validation.")
    except CollectionInvalid:
        db.command(
            "collMod",
            COLLECTION_NAME,
            validator=PROPERTY_JSON_SCHEMA,
            validationLevel="strict",
            validationAction="error",
        )
        print(f"Collection '{COLLECTION_NAME}' already existed — updated its validator.")

    db[COLLECTION_NAME].create_index("property_id", unique=True)
    print("Ensured unique index on 'property_id'.")


if __name__ == "__main__":
    main()
