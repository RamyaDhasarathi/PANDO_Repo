"""
Property category classification, shared between the candidate-generation hard filters and
the repository-level residential-only scope.

Hi Pando is residential-only for now (per user decision) — commercial properties (Office,
Retail, Warehouse, and any other non-residential label such as a bare "Commercial") are
entirely out of scope and excluded at the data-loading layer (see repository.py), not just
scored down. Land is treated as neither category and is never excluded on this basis.
"""

from pipelines.cleaning.text_cleaning import normalize_key

RESIDENTIAL_TYPES = {"apartment", "townhouse", "villa", "penthouse", "duplex", "studio"}
COMMERCIAL_TYPES = {"office", "retail", "warehouse", "commercial"}


def property_category(property_type: str) -> str | None:
    """Returns 'residential', 'commercial', or None (e.g. Land, or any other unrecognized
    label — treated as neither category, never excluded on this basis alone)."""
    key = normalize_key(property_type)
    if key in RESIDENTIAL_TYPES:
        return "residential"
    if key in COMMERCIAL_TYPES:
        return "commercial"
    return None


def is_residential(property_type: str) -> bool:
    return property_category(property_type) == "residential"
