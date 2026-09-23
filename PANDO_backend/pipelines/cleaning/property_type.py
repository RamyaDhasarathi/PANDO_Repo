from pipelines.cleaning.text_cleaning import normalize_key

CANONICAL_PROPERTY_TYPES = [
    "Apartment",
    "Townhouse",
    "Villa",
    "Penthouse",
    "Duplex",
    "Studio",
    "Office",
    "Retail",
    "Warehouse",
    "Land",
]

_VARIANT_TO_CANONICAL: dict[str, str] = {}


def _register(canonical: str, *variants: str) -> None:
    _VARIANT_TO_CANONICAL[normalize_key(canonical)] = canonical
    for variant in variants:
        _VARIANT_TO_CANONICAL[normalize_key(variant)] = canonical


_register("Apartment", "Apt", "Flat", "Condo", "Condominium", "Apartments")
_register("Townhouse", "Town House", "TH", "Town-house")
_register("Villa", "Villas", "Bungalow", "Beachfront Villa")
_register("Penthouse", "PH", "Pent House")
_register("Duplex", "Duplex Apartment", "Duplex Unit")
_register("Studio", "Studio Apartment", "Studio Flat")
_register("Office", "Office Space", "Commercial Office")
_register("Retail", "Retail Space", "Shop", "Retail Unit")
_register("Warehouse", "Storage", "Industrial")
_register("Land", "Plot", "Land Plot")


def normalize_property_type(raw_value: object) -> str | None:
    """Map a variant property-type label to the canonical set. Returns None if unrecognized."""
    key = normalize_key(raw_value)
    if not key:
        return None
    return _VARIANT_TO_CANONICAL.get(key)
