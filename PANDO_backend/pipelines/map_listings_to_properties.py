"""
Maps the pre-existing 'listings' collection (real property data used elsewhere in the app,
unrelated to this recommendation-engine schema) into our Property schema shape, then runs
the records through the Phase 1.2 cleaning pipeline before writing to hi_pando_properties.

'listings' has no direct field for developer or completion_status:
- developer <- listedBy (best available proxy; may be a broker name rather than a developer)
- completion_status <- "Off-Plan" if category == "Off-Plan", else "Ready" (listings collection
  only contains marketed/available units, so "Under Construction" is not inferable here)

'listings'.purpose ("sale" | "rent") drives listing_purpose and which price field is populated:
- purpose == "sale" -> listing_purpose = Sale, price <- listing.price
- purpose == "rent" -> listing_purpose = Rent, rent_price <- listing.price (the source field is
  an annual rent figure for rent listings, not a sale price — conflating the two would corrupt
  any sale-price-based feature/scoring, which is why the schema keeps them as separate fields)
"""

import argparse

from api.db import get_db
from pipelines.cleaning.pipeline import clean_property_record
from pipelines.schemas.property_schema import Property
from pydantic import ValidationError

SOURCE_COLLECTION_NAME = "listings"
TARGET_COLLECTION_NAME = "hi_pando_properties"


def _map_purpose(listing_purpose: str | None) -> list[str]:
    if listing_purpose == "rent":
        return ["Rental"]
    if listing_purpose == "sale":
        return ["Investment", "End use"]
    return []


def map_listing_to_property(listing: dict) -> dict:
    coordinates = listing.get("coordinates") or {}
    category = listing.get("category")
    is_rent = listing.get("purpose") == "rent"

    return {
        "property_id": f"LST-{listing.get('originalId') or listing.get('_id')}",
        "property_name": listing.get("title"),
        "developer": listing.get("listedBy"),
        "property_type": listing.get("propertyType"),
        "location": listing.get("community") or listing.get("city"),
        "community": listing.get("community"),
        "latitude": coordinates.get("lat"),
        "longitude": coordinates.get("lng"),
        "listing_purpose": "Rent" if is_rent else "Sale",
        "price": None if is_rent else listing.get("price"),
        "rent_price": listing.get("price") if is_rent else None,
        "bedrooms": listing.get("bedrooms"),
        "bathrooms": listing.get("bathrooms"),
        "built_up_area_sqft": listing.get("areaSqft"),
        "furnishing_status": listing.get("furnishing"),
        "completion_status": "Off-Plan" if category == "Off-Plan" else "Ready",
        "handover_date": None,
        "amenities": listing.get("amenities") or [],
        "parking": None,
        "view": None,
        "floor": None,
        "rental_estimate": None,
        "rental_yield": listing.get("yield"),
        "service_charges": None,
        "property_purpose": _map_purpose(listing.get("purpose")),
        "nearby_facilities": {},
    }


def run(dry_run: bool = False) -> None:
    db = get_db()
    listings = list(db[SOURCE_COLLECTION_NAME].find({}))

    if not listings:
        print(f"No documents found in '{SOURCE_COLLECTION_NAME}'.")
        return

    target_collection = db[TARGET_COLLECTION_NAME]

    inserted = 0
    updated = 0
    failed = 0

    for listing in listings:
        mapped = map_listing_to_property(listing)
        cleaned = clean_property_record(mapped)

        try:
            prop = Property.model_validate(cleaned)
        except ValidationError as e:
            failed += 1
            print(f"Validation failed for {mapped['property_id']}:")
            print(e)
            continue

        if dry_run:
            continue

        doc = prop.model_dump(mode="json")
        result = target_collection.replace_one(
            {"property_id": doc["property_id"]}, doc, upsert=True
        )
        if result.upserted_id is not None:
            inserted += 1
        else:
            updated += 1

    if dry_run:
        print(f"Dry run complete: {len(listings) - failed} would map successfully, {failed} failed.")
    else:
        print(f"Mapping complete: {inserted} inserted, {updated} updated, {failed} failed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Map the existing 'listings' collection into hi_pando_properties."
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Validate the mapping without writing to MongoDB."
    )
    args = parser.parse_args()
    run(dry_run=args.dry_run)
