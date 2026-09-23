from pipelines.cleaning.text_cleaning import normalize_key

CANONICAL_LOCATIONS = [
    "Dubai Marina",
    "Jumeirah Village Circle",
    "Downtown Dubai",
    "Palm Jumeirah",
    "Business Bay",
    "Jumeirah Lake Towers",
    "Arabian Ranches",
    "Dubai Hills Estate",
    "Al Barsha",
    "Dubai Silicon Oasis",
    "Dubai Sports City",
    "Jumeirah Beach Residence",
    "Dubai Creek Harbour",
    "Mirdif",
    "Dubai South",
]

_VARIANT_TO_CANONICAL: dict[str, str] = {}


def _register(canonical: str, *variants: str) -> None:
    _VARIANT_TO_CANONICAL[normalize_key(canonical)] = canonical
    for variant in variants:
        _VARIANT_TO_CANONICAL[normalize_key(variant)] = canonical


_register("Dubai Marina", "Marina", "The Marina", "Dubai-Marina")
_register("Jumeirah Village Circle", "JVC", "Jumeirah Village Circle (JVC)", "J.V.C")
_register("Downtown Dubai", "Downtown", "DTD", "Down Town Dubai")
_register("Palm Jumeirah", "The Palm", "Palm", "Palm Jumeirah Island")
_register("Business Bay", "BB", "Business-Bay")
_register("Jumeirah Lake Towers", "JLT", "Jumeirah Lakes Towers")
_register("Arabian Ranches", "AR", "Arabian Ranches 1", "Arabian Ranches 2")
_register("Dubai Hills Estate", "Dubai Hills", "DHE")
_register("Al Barsha", "Barsha", "Al-Barsha")
_register("Dubai Silicon Oasis", "DSO", "Silicon Oasis")
_register("Dubai Sports City", "DSC", "Sports City")
_register("Jumeirah Beach Residence", "JBR", "Jumeirah Beach Residences")
_register("Dubai Creek Harbour", "Creek Harbour", "Creek Harbor")
_register("Mirdif", "Mirdiff", "Mirdif City Centre Area")
_register("Dubai South", "Dubai World Central", "DWC")


def normalize_location(raw_value: object) -> str | None:
    """Map a variant location/community label to the canonical list. Returns None if unrecognized."""
    key = normalize_key(raw_value)
    if not key:
        return None
    return _VARIANT_TO_CANONICAL.get(key)
