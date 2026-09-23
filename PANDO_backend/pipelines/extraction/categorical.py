import re

from pipelines.cleaning.amenities import CANONICAL_AMENITIES
from pipelines.cleaning.location import CANONICAL_LOCATIONS
from pipelines.cleaning.property_type import CANONICAL_PROPERTY_TYPES
from pipelines.cleaning.text_cleaning import normalize_key
from pipelines.schemas.user_dna_schema import Purpose, RentalYieldPreference, TransportPreference

# Extra conversational aliases beyond what Phase 1.2's canonical maps already recognize
# (those are tuned for messy *data entry*, not natural conversation phrasing).
_LOCATION_ALIASES = {
    "the marina": "Dubai Marina",
    "marina": "Dubai Marina",
    "jvc": "Jumeirah Village Circle",
    "downtown": "Downtown Dubai",
    "the palm": "Palm Jumeirah",
    "jlt": "Jumeirah Lake Towers",
    "jbr": "Jumeirah Beach Residence",
}

_PROPERTY_TYPE_ALIASES = {
    "apt": "Apartment",
    "flat": "Apartment",
    "condo": "Apartment",
    "town house": "Townhouse",
    "house": "Villa",
}


def _find_all_canonical(text: str, canonical_list: list[str], aliases: dict[str, str]) -> list[str]:
    lower = text.lower()
    found: list[str] = []

    for canonical in canonical_list:
        if canonical.lower() in lower and canonical not in found:
            found.append(canonical)

    for alias, canonical in aliases.items():
        if re.search(rf"\b{re.escape(alias)}\b", lower) and canonical not in found:
            found.append(canonical)

    return found


def extract_locations(text: str) -> list[str]:
    return _find_all_canonical(text, CANONICAL_LOCATIONS, _LOCATION_ALIASES)


def extract_property_types(text: str) -> list[str]:
    return _find_all_canonical(text, CANONICAL_PROPERTY_TYPES, _PROPERTY_TYPE_ALIASES)


def extract_amenities(text: str) -> list[str]:
    return _find_all_canonical(text, CANONICAL_AMENITIES, {})


_BEDROOM_PATTERNS = [
    re.compile(r"(?P<n>\d+)\s*(?:-|\s)?(?:bed(?:room)?s?|br|bhk)\b", re.IGNORECASE),
    re.compile(r"studio", re.IGNORECASE),
]


def extract_bedrooms(text: str) -> int | None:
    for pattern in _BEDROOM_PATTERNS:
        match = pattern.search(text)
        if match:
            if "n" in match.groupdict() and match.group("n") is not None:
                return int(match.group("n"))
            return 0  # "studio" -> 0 bedrooms
    return None


_PURPOSE_PATTERNS = {
    Purpose.INVESTMENT: [r"invest", r"capital appreciation", r"\bflip\b"],
    Purpose.RENTAL: [r"rent (?:it |them )?out", r"rental income", r"buy to let", r"let out"],
    Purpose.END_USE: [r"live in", r"to live", r"for my family", r"own use", r"end use", r"move in"],
}


def extract_purpose(text: str) -> Purpose | None:
    lower = text.lower()
    for purpose, patterns in _PURPOSE_PATTERNS.items():
        if any(re.search(p, lower) for p in patterns):
            return purpose
    return None


_TRANSPORT_KEYWORDS = ["near metro", "close to metro", "near the metro", "metro station", "walking distance to metro"]


def extract_transport_preference(text: str) -> TransportPreference | None:
    lower = text.lower()
    if any(kw in lower for kw in _TRANSPORT_KEYWORDS) or re.search(r"\bmetro\b", lower):
        return TransportPreference.NEAR_METRO
    return None


_YIELD_KEYWORDS = {
    RentalYieldPreference.HIGH: ["high yield", "high rental yield", "good returns", "strong returns", "high roi"],
    RentalYieldPreference.MEDIUM: ["moderate yield", "average yield", "decent returns"],
    RentalYieldPreference.LOW: ["low yield", "not concerned about yield"],
}


def extract_rental_yield_preference(text: str) -> RentalYieldPreference | None:
    lower = text.lower()
    for preference, keywords in _YIELD_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return preference
    return None
