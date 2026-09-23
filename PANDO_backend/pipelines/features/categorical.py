from pipelines.cleaning.amenities import CANONICAL_AMENITIES
from pipelines.cleaning.location import CANONICAL_LOCATIONS
from pipelines.cleaning.property_type import CANONICAL_PROPERTY_TYPES


def one_hot_encode(value: str | None, categories: list[str], prefix: str) -> dict[str, int]:
    """One-hot encode a single categorical value over a fixed category list, plus an 'other' bucket
    for values outside the known categories (e.g. unrecognized during cleaning)."""
    encoding = {f"{prefix}_{cat}": 0 for cat in categories}
    encoding[f"{prefix}_other"] = 0

    if value in categories:
        encoding[f"{prefix}_{value}"] = 1
    else:
        encoding[f"{prefix}_other"] = 1

    return encoding


def multi_hot_encode(values: list[str], categories: list[str], prefix: str) -> dict[str, int]:
    """Multi-hot encode a list of categorical values (e.g. amenities) over a fixed category list."""
    value_set = set(values or [])
    return {f"{prefix}_{cat}": int(cat in value_set) for cat in categories}


def encode_property_type(property_type: str | None) -> dict[str, int]:
    return one_hot_encode(property_type, CANONICAL_PROPERTY_TYPES, prefix="property_type")


def encode_location(location: str | None) -> dict[str, int]:
    return one_hot_encode(location, CANONICAL_LOCATIONS, prefix="location")


def encode_amenities(amenities: list[str]) -> dict[str, int]:
    return multi_hot_encode(amenities, CANONICAL_AMENITIES, prefix="amenity")
