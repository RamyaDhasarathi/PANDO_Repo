"""
Phase 2.3 feature matching: one scorer per match type, each comparing a UserDNA field against
a Property field and returning a float in [0, 1] (0 = no match, 1 = perfect match).

Shared convention: when the relevant UserDNA field is unset (the user never stated that
preference), the scorer returns NEUTRAL_SCORE rather than 0 or 1 — an unstated preference must
not be treated as either a strong match or a penalty. This mirrors the missing-value philosophy
from Phase 1.2/2.2 (None means "not stated," not "no").
"""

from pipelines.cleaning.text_cleaning import normalize_key
from pipelines.schemas.property_schema import Property
from pipelines.schemas.user_dna_schema import Purpose, RentalYieldPreference, TransportPreference, UserDNA

NEUTRAL_SCORE = 0.75

# Rental yield bands (annual %, typical Dubai market ranges) used to translate a property's
# numeric rental_yield into the same High/Medium/Low vocabulary as RentalYieldPreference.
_YIELD_HIGH_THRESHOLD = 7.0
_YIELD_MEDIUM_THRESHOLD = 5.0

# How far over budget a price can be before Budget Match bottoms out at 0. A property exactly
# at budget.max scores 1.0; one at (1 + _OVERAGE_TOLERANCE) x budget.max scores 0.0.
_OVERAGE_TOLERANCE = 0.5


def _property_price(property_: Property) -> float | None:
    return property_.price if property_.listing_purpose.value == "Sale" else property_.rent_price


def score_budget_match(user_dna: UserDNA, property_: Property) -> float:
    if user_dna.budget is None or (user_dna.budget.min is None and user_dna.budget.max is None):
        return NEUTRAL_SCORE

    price = _property_price(property_)
    if price is None:
        return NEUTRAL_SCORE

    low = user_dna.budget.min
    high = user_dna.budget.max

    if low is not None and price < low:
        deficit_ratio = (low - price) / low if low > 0 else 1.0
        return max(0.0, 1.0 - deficit_ratio)

    if high is not None and price > high:
        overage_ratio = (price - high) / high if high > 0 else 1.0
        return max(0.0, 1.0 - overage_ratio / _OVERAGE_TOLERANCE)

    return 1.0


def score_location_match(user_dna: UserDNA, property_: Property) -> float:
    if not user_dna.locations:
        return NEUTRAL_SCORE
    wanted = {normalize_key(loc) for loc in user_dna.locations}
    return 1.0 if normalize_key(property_.location) in wanted else 0.0


def score_property_type_match(user_dna: UserDNA, property_: Property) -> float:
    if not user_dna.property_types:
        return NEUTRAL_SCORE
    wanted = {normalize_key(t) for t in user_dna.property_types}
    return 1.0 if normalize_key(property_.property_type) in wanted else 0.0


def score_bedroom_match(user_dna: UserDNA, property_: Property) -> float:
    if user_dna.bedrooms is None:
        return NEUTRAL_SCORE
    diff = abs(property_.bedrooms - user_dna.bedrooms)
    if diff == 0:
        return 1.0
    return max(0.0, 1.0 - 0.25 * diff)


_PURPOSE_TO_PROPERTY_PURPOSE = {
    Purpose.INVESTMENT: "Investment",
    Purpose.END_USE: "End use",
    Purpose.RENTAL: "Rental",
}


def score_purpose_match(user_dna: UserDNA, property_: Property) -> float:
    if user_dna.purpose is None:
        return NEUTRAL_SCORE
    wanted = _PURPOSE_TO_PROPERTY_PURPOSE[user_dna.purpose]
    property_purposes = {p.value for p in property_.property_purpose}
    return 1.0 if wanted in property_purposes else 0.0


def score_amenity_match(user_dna: UserDNA, property_: Property) -> float:
    if not user_dna.amenities:
        return NEUTRAL_SCORE
    wanted = {normalize_key(a) for a in user_dna.amenities}
    available = {normalize_key(a) for a in property_.amenities}
    if not wanted:
        return NEUTRAL_SCORE
    matched = wanted & available
    return len(matched) / len(wanted)


def score_area_match(user_dna: UserDNA, property_: Property) -> float:
    """UserDNA has no stated area/sqft preference field (see Phase 2.3 decision) — always
    neutral until such a field exists to compare against."""
    return NEUTRAL_SCORE


def score_transport_match(user_dna: UserDNA, property_: Property) -> float:
    if user_dna.transport_preference is None or user_dna.transport_preference == TransportPreference.NO_PREFERENCE:
        return NEUTRAL_SCORE

    metro_distance = property_.nearby_facilities.metro_distance_km
    if metro_distance is None:
        return NEUTRAL_SCORE

    if metro_distance <= 1.0:
        return 1.0
    if metro_distance >= 5.0:
        return 0.0
    return 1.0 - (metro_distance - 1.0) / 4.0


def _yield_band(rental_yield: float) -> RentalYieldPreference:
    if rental_yield >= _YIELD_HIGH_THRESHOLD:
        return RentalYieldPreference.HIGH
    if rental_yield >= _YIELD_MEDIUM_THRESHOLD:
        return RentalYieldPreference.MEDIUM
    return RentalYieldPreference.LOW


_YIELD_BAND_ORDER = [RentalYieldPreference.LOW, RentalYieldPreference.MEDIUM, RentalYieldPreference.HIGH]


def score_investment_match(user_dna: UserDNA, property_: Property) -> float:
    if (
        user_dna.rental_yield_preference is None
        or user_dna.rental_yield_preference == RentalYieldPreference.NO_PREFERENCE
    ):
        return NEUTRAL_SCORE

    if property_.rental_yield is None:
        return NEUTRAL_SCORE

    wanted_band = user_dna.rental_yield_preference
    actual_band = _yield_band(property_.rental_yield)

    if wanted_band == actual_band:
        return 1.0

    band_distance = abs(_YIELD_BAND_ORDER.index(wanted_band) - _YIELD_BAND_ORDER.index(actual_band))
    return max(0.0, 1.0 - 0.5 * band_distance)


ALL_SCORERS = {
    "budget_match": score_budget_match,
    "location_match": score_location_match,
    "property_type_match": score_property_type_match,
    "bedroom_match": score_bedroom_match,
    "purpose_match": score_purpose_match,
    "amenity_match": score_amenity_match,
    "area_match": score_area_match,
    "transport_match": score_transport_match,
    "investment_match": score_investment_match,
}


def score_all(user_dna: UserDNA, property_: Property) -> dict[str, float]:
    return {name: scorer(user_dna, property_) for name, scorer in ALL_SCORERS.items()}
