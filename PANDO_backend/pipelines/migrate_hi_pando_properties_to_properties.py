"""
Migrates records from 'hi_pando_properties' (the ML-pipeline's canonical, schema-validated
property dataset) into 'properties' (the Node/Next.js app's legacy display-oriented collection,
backed by lib/models/Property.js).

Only fields that exist in both schemas are mapped; fields unique to hi_pando_properties
(listing_purpose, rent_price, completion_status, furnishing_status, nearby_facilities,
property_purpose, handover_date, parking, view, floor, rental_estimate, service_charges)
have no equivalent in the Property.js schema and are dropped.

price is taken from hi_pando_properties.price if present, else falls back to rent_price,
so Rent-purpose records (which only populate rent_price) still end up with a usable price.

Existing documents in 'properties' are left untouched; migrated records are upserted by
originalId = hi_pando_properties.property_id so re-running this script is idempotent.
"""

import argparse

from api.db import get_db

SOURCE_COLLECTION_NAME = "hi_pando_properties"
TARGET_COLLECTION_NAME = "properties"


def map_hi_pando_property_to_property(record: dict) -> dict:
    price = record.get("price")
    if price is None:
        price = record.get("rent_price")

    return {
        "originalId": record.get("property_id"),
        "name": record.get("property_name"),
        "location": record.get("location"),
        "propertyType": record.get("property_type"),
        "bedrooms": record.get("bedrooms"),
        "bathrooms": record.get("bathrooms"),
        "area": record.get("built_up_area_sqft"),
        "price": price,
        "yield": record.get("rental_yield"),
        "amenities": record.get("amenities") or [],
    }


def run(dry_run: bool = False) -> None:
    db = get_db()
    records = list(db[SOURCE_COLLECTION_NAME].find({}, {"_id": 0}))

    if not records:
        print(f"No documents found in '{SOURCE_COLLECTION_NAME}'.")
        return

    target_collection = db[TARGET_COLLECTION_NAME]

    inserted = 0
    updated = 0

    for record in records:
        mapped = map_hi_pando_property_to_property(record)

        if dry_run:
            continue

        result = target_collection.update_one(
            {"originalId": mapped["originalId"]},
            {"$set": mapped},
            upsert=True,
        )
        if result.upserted_id is not None:
            inserted += 1
        else:
            updated += 1

    if dry_run:
        print(f"Dry run complete: {len(records)} would be mapped and upserted into '{TARGET_COLLECTION_NAME}'.")
    else:
        print(f"Migration complete: {inserted} inserted, {updated} updated in '{TARGET_COLLECTION_NAME}'.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Migrate hi_pando_properties records into the 'properties' collection."
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview the migration without writing to MongoDB."
    )
    args = parser.parse_args()
    run(dry_run=args.dry_run)
