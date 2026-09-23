"""
Per-field defaults applied to raw property records before schema validation.

Rules:
- Required identity fields (property_id, property_name, property_type, location, bedrooms,
  bathrooms, built_up_area_sqft, completion_status, listing_purpose) are never defaulted —
  a missing value there is a data-quality failure that should surface, not be silently filled.
- price/rent_price are conditionally required based on listing_purpose (enforced by the
  Property schema's model validator, not here) — both default to None at the cleaning stage.
- Optional descriptive fields default to None (absent) rather than a fabricated value.
- Optional list fields default to an empty list rather than None, so downstream code can
  always iterate them without a null check.
- Optional numeric fields with a natural "unknown" default (parking, floor) stay None rather
  than 0, since 0 is a valid real value (no parking / ground floor) and would be misleading.
"""

_LIST_DEFAULT_FIELDS = {"amenities", "property_purpose"}

_NONE_DEFAULT_FIELDS = {
    "developer",
    "community",
    "latitude",
    "longitude",
    "price",
    "rent_price",
    "furnishing_status",
    "handover_date",
    "parking",
    "view",
    "floor",
    "rental_estimate",
    "rental_yield",
    "service_charges",
}


def apply_missing_value_defaults(record: dict) -> dict:
    """Return a copy of `record` with documented defaults applied for missing optional fields."""
    result = dict(record)

    for field in _LIST_DEFAULT_FIELDS:
        if result.get(field) is None:
            result[field] = []

    for field in _NONE_DEFAULT_FIELDS:
        result.setdefault(field, None)

    if result.get("nearby_facilities") is None:
        result["nearby_facilities"] = {}

    return result
