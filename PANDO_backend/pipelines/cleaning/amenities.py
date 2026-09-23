from pipelines.cleaning.text_cleaning import normalize_key

CANONICAL_AMENITIES = [
    "Gym",
    "Pool",
    "Parking",
    "Security",
    "Garden",
    "Private Beach",
    "Kids Play Area",
    "BBQ Area",
    "Concierge",
    "Sauna",
    "Steam Room",
    "Tennis Court",
    "Pet Friendly",
    "Balcony",
    "Maid's Room",
]

_VARIANT_TO_CANONICAL: dict[str, str] = {}


def _register(canonical: str, *variants: str) -> None:
    _VARIANT_TO_CANONICAL[normalize_key(canonical)] = canonical
    for variant in variants:
        _VARIANT_TO_CANONICAL[normalize_key(variant)] = canonical


_register("Gym", "Gymnasium", "Fitness Center", "Fitness Centre")
_register("Pool", "Swimming Pool", "Infinity Pool", "Infinity Lagoon", "Shared Pool")
_register("Parking", "Covered Parking", "Car Parking", "Garage")
_register("Security", "24/7 Security", "Security Guard", "Gated Security")
_register("Garden", "Landscaped Garden", "Private Garden")
_register("Private Beach", "Beach Access", "Direct Beach Access", "Private Mooring")
_register("Kids Play Area", "Children's Play Area", "Kids Area", "Playground")
_register("BBQ Area", "Barbecue Area", "BBQ")
_register("Concierge", "Concierge Service", "Front Desk")
_register("Sauna", "Sauna Room")
_register("Steam Room", "Steam Bath")
_register("Tennis Court", "Tennis")
_register("Pet Friendly", "Pets Allowed")
_register("Balcony", "Terrace", "Private Balcony")
_register("Maid's Room", "Maids Room", "Maid Room")


def normalize_amenity(raw_value: object) -> str | None:
    """Map a single variant amenity label to the canonical list. Returns None if unrecognized."""
    key = normalize_key(raw_value)
    if not key:
        return None
    return _VARIANT_TO_CANONICAL.get(key)


def normalize_amenities(raw_values: object) -> list[str]:
    """Normalize a list of amenity labels: map each to canonical, drop unrecognized/duplicates, keep order."""
    if not raw_values:
        return []
    seen: set[str] = set()
    result: list[str] = []
    for raw in raw_values:
        canonical = normalize_amenity(raw)
        if canonical and canonical not in seen:
            seen.add(canonical)
            result.append(canonical)
    return result
