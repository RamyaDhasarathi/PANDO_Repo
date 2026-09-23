"""
Phase 3.3 (User x Property Features — "particularly important" per the plan).

Where a feature has no better raw/continuous form than the existing Phase 2.3 match score,
this module reuses that score as-is rather than manufacturing a redundant duplicate:
  - Location Similarity  -> reuses match_location_match (already exactly binary match/no-match)
  - Property Type Match  -> reuses match_property_type_match (same reasoning)

Everywhere else, a genuinely new raw/continuous feature is built alongside the existing 0-1
match score, since a raw value often carries information a decayed 0-1 score discards (e.g.
"200k over budget" vs "300k under budget" both might score similarly on match_budget_match,
but are very different signals for a model to learn from):
  - Price Difference        -> property price/rent_price minus the user's relevant budget bound
  - Budget Compatibility     -> price / budget_max ratio (how many multiples of budget)
  - Bedroom Difference       -> signed integer delta (property bedrooms - user's stated bedrooms)
  - Amenity Similarity       -> Jaccard index (symmetric overlap), vs. match_amenity_match's
                                asymmetric "coverage of what the user asked for" ratio
  - Distance Preference      -> raw metro_distance_km (continuous), vs. match_transport_match's
                                thresholded 0-1 score
  - Investment Compatibility -> property's rental_yield minus a numeric threshold derived from
                                the user's stated RentalYieldPreference band
  - Historical User Interest -> new: has this user positively interacted with this property
                                before, or with other properties sharing its location/type?
"""

from pipelines.schemas.user_dna_schema import RentalYieldPreference

# Numeric yield thresholds mirroring pipelines/matching/scorers.py's banding, so
# investment_compatibility is directly comparable to that scorer's logic.
_YIELD_THRESHOLD_BY_PREFERENCE = {
    RentalYieldPreference.HIGH: 7.0,
    RentalYieldPreference.MEDIUM: 5.0,
    RentalYieldPreference.LOW: 0.0,
}


def _property_price(property_doc: dict) -> float | None:
    if property_doc.get("listing_purpose") == "Rent":
        return property_doc.get("rent_price")
    return property_doc.get("price")


def compute_price_difference(user_dna: dict, property_doc: dict) -> float | None:
    """Signed AED difference between the property's relevant price and the user's budget
    bound closest to it (max if over, min if under, midpoint if within/no bound stated)."""
    price = _property_price(property_doc)
    budget = user_dna.get("budget") or {}
    low, high = budget.get("min"), budget.get("max")

    if price is None:
        return None
    if low is None and high is None:
        return None
    if high is not None and price > high:
        return price - high
    if low is not None and price < low:
        return price - low
    return 0.0


def compute_budget_compatibility(user_dna: dict, property_doc: dict) -> float | None:
    """price / budget_max ratio: 1.0 = exactly at budget ceiling, <1 = under, >1 = over."""
    price = _property_price(property_doc)
    budget_max = (user_dna.get("budget") or {}).get("max")
    if price is None or not budget_max:
        return None
    return price / budget_max


def compute_bedroom_difference(user_dna: dict, property_doc: dict) -> int | None:
    user_bedrooms = user_dna.get("bedrooms")
    property_bedrooms = property_doc.get("bedrooms")
    if user_bedrooms is None or property_bedrooms is None:
        return None
    return property_bedrooms - user_bedrooms


def compute_amenity_similarity(user_dna: dict, property_doc: dict) -> float | None:
    """Jaccard index: |wanted ∩ available| / |wanted ∪ available| — symmetric, unlike
    match_amenity_match's asymmetric "how much of what the user wanted is present" ratio."""
    wanted = set(user_dna.get("amenities") or [])
    available = set(property_doc.get("amenities") or [])
    union = wanted | available
    if not union:
        return None
    return len(wanted & available) / len(union)


def compute_distance_preference(property_doc: dict) -> float | None:
    """Raw metro distance in km — the continuous counterpart to match_transport_match's
    thresholded 0-1 score. None if the property has no nearby-facility data."""
    return (property_doc.get("nearby_facilities") or {}).get("metro_distance_km")


def compute_investment_compatibility(user_dna: dict, property_doc: dict) -> float | None:
    """rental_yield minus the numeric threshold implied by the user's stated yield preference
    band — positive means the property clears the bar, negative means it falls short."""
    rental_yield = property_doc.get("rental_yield")
    preference = user_dna.get("rental_yield_preference")
    if rental_yield is None or not preference:
        return None
    threshold = _YIELD_THRESHOLD_BY_PREFERENCE.get(RentalYieldPreference(preference))
    if threshold is None:
        return None
    return rental_yield - threshold


def compute_historical_user_interest(
    user_id: str, property_doc: dict, user_interaction_history: list[dict]
) -> float:
    """
    0-1 signal for whether this user has shown positive interest in this exact property, or in
    other properties sharing its location/type, based on their interaction history so far.
    `user_interaction_history` is the caller-provided list of the user's prior interactions
    (each a dict with at least propertyId/location/property_type/label-ish info) — passed in
    rather than queried here, since the caller (build_training_dataset) already has to fetch
    it and a point-in-time cutoff (no future leakage) must be respected by that caller.

    Returns 1.0 if the user positively interacted with this exact property before, 0.5 if they
    positively interacted with another property in the same location or of the same type,
    0.0 otherwise (including when there's no prior history at all).
    """
    if not user_interaction_history:
        return 0.0

    same_property = [
        h for h in user_interaction_history if h.get("propertyId") == property_doc.get("property_id")
    ]
    if any(h.get("label") == "Positive" for h in same_property):
        return 1.0

    location = property_doc.get("location")
    property_type = property_doc.get("property_type")
    related = [
        h
        for h in user_interaction_history
        if h.get("label") == "Positive"
        and (h.get("location") == location or h.get("property_type") == property_type)
    ]
    if related:
        return 0.5

    return 0.0


def compute_interaction_features(
    user_id: str,
    user_dna: dict,
    property_doc: dict,
    match_scores: dict,
    user_interaction_history: list[dict],
) -> dict:
    """
    Assembles all 9 User x Property features into one flat dict for a training row.
    `match_scores` is the Phase 2.3 match-score snapshot for this exact user/property
    interaction (already computed and stored — see build_training_dataset.py); reused directly
    for location_similarity/property_type_match since those already are the best available
    signal for those two features (see module docstring).
    """
    return {
        "price_difference": compute_price_difference(user_dna, property_doc),
        "budget_compatibility": compute_budget_compatibility(user_dna, property_doc),
        "location_similarity": match_scores.get("location_match"),
        "property_type_match": match_scores.get("property_type_match"),
        "bedroom_difference": compute_bedroom_difference(user_dna, property_doc),
        "amenity_similarity": compute_amenity_similarity(user_dna, property_doc),
        "historical_user_interest": compute_historical_user_interest(
            user_id, property_doc, user_interaction_history
        ),
        "distance_preference": compute_distance_preference(property_doc),
        "investment_compatibility": compute_investment_compatibility(user_dna, property_doc),
    }
