"""
Synthetic Dubai property generator for Phase 1.4.

Generates realistic-looking property records with variation across location, price,
property type, bedrooms, amenities, and investment characteristics (rental yield,
purpose). Output is meant for development/testing dataset volume, not as a stand-in
for real user interaction data (see checklist rule: no synthetic *interaction* data).
"""

import argparse
import random

from api.db import get_db
from pipelines.cleaning.amenities import CANONICAL_AMENITIES
from pipelines.cleaning.location import CANONICAL_LOCATIONS
from pipelines.cleaning.property_type import CANONICAL_PROPERTY_TYPES
from pipelines.schemas.property_schema import CompletionStatus, FurnishingStatus, Property

COLLECTION_NAME = "hi_pando_properties"

# Bedroom range and per-bedroom base price/area vary by property type, since a "Studio"
# and a "Villa" should not draw from the same distribution.
_TYPE_PROFILES = {
    "Studio": {"bedrooms": (0, 0), "base_price": 550_000, "base_sqft": 450},
    "Apartment": {"bedrooms": (1, 4), "base_price": 750_000, "base_sqft": 650},
    "Duplex": {"bedrooms": (2, 4), "base_price": 1_400_000, "base_sqft": 1400},
    "Penthouse": {"bedrooms": (3, 6), "base_price": 4_500_000, "base_sqft": 2800},
    "Townhouse": {"bedrooms": (2, 5), "base_price": 1_600_000, "base_sqft": 1800},
    "Villa": {"bedrooms": (3, 7), "base_price": 3_200_000, "base_sqft": 3200},
    "Office": {"bedrooms": (0, 0), "base_price": 1_100_000, "base_sqft": 900},
    "Retail": {"bedrooms": (0, 0), "base_price": 1_800_000, "base_sqft": 1100},
    "Warehouse": {"bedrooms": (0, 0), "base_price": 2_600_000, "base_sqft": 5000},
    "Land": {"bedrooms": (0, 0), "base_price": 3_000_000, "base_sqft": 6000},
}

_DEVELOPERS = ["Emaar", "Damac", "Nakheel", "Meraas", "Sobha Realty", "Azizi Developments"]
_VIEWS = ["Marina View", "Sea View", "Community View", "Golf Course View", "City Skyline View", None]

_DUBAI_LAT_RANGE = (24.75, 25.35)
_DUBAI_LON_RANGE = (54.95, 55.55)


def _random_amenities(rng: random.Random) -> list[str]:
    k = rng.randint(2, 6)
    return rng.sample(CANONICAL_AMENITIES, k=k)


def _random_purpose(rng: random.Random) -> list[str]:
    options = [["Investment"], ["Rental"], ["End use"], ["Investment", "Rental"], ["End use", "Investment"]]
    return rng.choice(options)


def generate_property(index: int, rng: random.Random) -> dict:
    property_type = rng.choice(CANONICAL_PROPERTY_TYPES)
    profile = _TYPE_PROFILES[property_type]
    min_br, max_br = profile["bedrooms"]
    bedrooms = rng.randint(min_br, max_br)
    bathrooms = max(1, bedrooms + rng.choice([-1, 0, 0, 1]))

    size_variance = rng.uniform(0.7, 1.6)
    built_up_area_sqft = round(profile["base_sqft"] * (1 + 0.35 * bedrooms) * size_variance, 0)

    price_per_sqft_variance = rng.uniform(0.8, 1.5)
    price = round(profile["base_price"] * (1 + 0.3 * bedrooms) * price_per_sqft_variance, -3)

    location = rng.choice(CANONICAL_LOCATIONS)
    rental_yield = round(rng.uniform(3.5, 9.0), 2)
    completion_status = rng.choices(
        [CompletionStatus.READY, CompletionStatus.OFF_PLAN, CompletionStatus.UNDER_CONSTRUCTION],
        weights=[0.65, 0.2, 0.15],
    )[0]

    return {
        "property_id": f"SYN-{index:04d}",
        "property_name": f"{location} {property_type} #{index}",
        "developer": rng.choice(_DEVELOPERS),
        "property_type": property_type,
        "location": location,
        "community": location,
        "latitude": round(rng.uniform(*_DUBAI_LAT_RANGE), 6),
        "longitude": round(rng.uniform(*_DUBAI_LON_RANGE), 6),
        "listing_purpose": "Sale",
        "price": price,
        "rent_price": None,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "built_up_area_sqft": built_up_area_sqft,
        "furnishing_status": rng.choice(list(FurnishingStatus)),
        "completion_status": completion_status,
        "handover_date": None,
        "amenities": _random_amenities(rng),
        "parking": rng.choice([0, 1, 1, 2]),
        "view": rng.choice(_VIEWS),
        "floor": rng.randint(1, 45) if property_type in ("Apartment", "Penthouse", "Duplex", "Studio") else None,
        "rental_estimate": round(price * rental_yield / 100, 0),
        "rental_yield": rental_yield,
        "service_charges": round(built_up_area_sqft * rng.uniform(8, 25), 0),
        "property_purpose": _random_purpose(rng),
        "nearby_facilities": {
            "metro_distance_km": round(rng.uniform(0.1, 12.0), 2),
            "schools_distance_km": round(rng.uniform(0.2, 8.0), 2),
            "hospitals_distance_km": round(rng.uniform(0.3, 10.0), 2),
            "shopping_distance_km": round(rng.uniform(0.1, 6.0), 2),
            "beaches_distance_km": round(rng.uniform(0.1, 25.0), 2),
            "business_districts_distance_km": round(rng.uniform(0.5, 20.0), 2),
        },
    }


def generate_properties(count: int, seed: int | None = None) -> list[dict]:
    rng = random.Random(seed)
    return [generate_property(i, rng) for i in range(1, count + 1)]


def run(count: int, seed: int | None) -> None:
    records = generate_properties(count, seed=seed)

    validated = []
    failed = 0
    for raw in records:
        try:
            prop = Property.model_validate(raw)
            validated.append(prop.model_dump(mode="json"))
        except Exception as e:
            failed += 1
            print(f"Validation failed for {raw['property_id']}: {e}")

    db = get_db()
    collection = db[COLLECTION_NAME]

    inserted = 0
    updated = 0
    for doc in validated:
        result = collection.replace_one({"property_id": doc["property_id"]}, doc, upsert=True)
        if result.upserted_id is not None:
            inserted += 1
        else:
            updated += 1

    print(f"Generated {count} synthetic properties: {inserted} inserted, {updated} updated, {failed} failed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic Dubai property records.")
    parser.add_argument("--count", type=int, default=300, help="Number of synthetic properties to generate.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    args = parser.parse_args()
    run(count=args.count, seed=args.seed)
