NEARBY_FACILITY_FIELDS = [
    "metro_distance_km",
    "schools_distance_km",
    "hospitals_distance_km",
    "shopping_distance_km",
    "beaches_distance_km",
    "business_districts_distance_km",
]

# Used when a distance is missing/unknown: treat as "far away" so the model doesn't
# mistake "no data" for "very close" (which a 0 default would imply).
MISSING_DISTANCE_FALLBACK_KM = 50.0


def encode_bedrooms_bathrooms(bedrooms: int | None, bathrooms: int | None) -> dict[str, float]:
    return {
        "bedrooms": float(bedrooms) if bedrooms is not None else 0.0,
        "bathrooms": float(bathrooms) if bathrooms is not None else 0.0,
    }


def encode_rental_yield(rental_yield: float | None) -> dict[str, float]:
    return {
        "rental_yield": float(rental_yield) if rental_yield is not None else 0.0,
        "rental_yield_known": int(rental_yield is not None),
    }


def encode_nearby_facilities(nearby_facilities: dict) -> dict[str, float]:
    """Numeric distance-to-facility features. Missing distances get a large fallback value
    plus a companion `_known` flag, so the model can distinguish "far" from "unknown"."""
    nearby_facilities = nearby_facilities or {}
    features: dict[str, float] = {}

    for field in NEARBY_FACILITY_FIELDS:
        value = nearby_facilities.get(field)
        features[field] = float(value) if value is not None else MISSING_DISTANCE_FALLBACK_KM
        features[f"{field}_known"] = int(value is not None)

    return features
