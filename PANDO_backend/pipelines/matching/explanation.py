"""
Phase 2.6: turns a property's match-score breakdown into a short, natural-sounding list of
reasons it was recommended — an advisor's rationale, not a dump of raw scores. Only match
components that scored highly and correspond to something the user actually stated make it
into the explanation; a NEUTRAL_SCORE (unstated preference) never becomes a bullet point,
since there's nothing to compliment the property on if the user never asked for it.
"""

from pipelines.matching.scorers import NEUTRAL_SCORE
from pipelines.schemas.property_schema import Property
from pipelines.schemas.user_dna_schema import UserDNA

STRONG_MATCH_THRESHOLD = 0.8


def _explain_budget(user_dna: UserDNA, property_: Property) -> str | None:
    if user_dna.budget is None:
        return None
    return "Within your budget"


def _explain_location(user_dna: UserDNA, property_: Property) -> str | None:
    if not user_dna.locations:
        return None
    return f"Located in {property_.location}, one of your preferred areas"


def _article_for(word: str) -> str:
    return "an" if word[:1].lower() in "aeiou" else "a"


def _explain_property_type(user_dna: UserDNA, property_: Property) -> str | None:
    if not user_dna.property_types:
        return None
    type_lower = property_.property_type.lower()
    return f"{_article_for(type_lower).capitalize()} {type_lower}, as you requested"


def _explain_bedrooms(user_dna: UserDNA, property_: Property) -> str | None:
    if user_dna.bedrooms is None:
        return None
    return f"Matches your {property_.bedrooms}-bedroom requirement"


def _explain_purpose(user_dna: UserDNA, property_: Property) -> str | None:
    if user_dna.purpose is None:
        return None
    purpose_phrases = {
        "Investment": "Well suited for investment",
        "End use": "A good fit to live in yourself",
        "Rental": "Suitable for renting out",
    }
    return purpose_phrases.get(user_dna.purpose.value)


def _explain_amenities(user_dna: UserDNA, property_: Property, match_score: float) -> str | None:
    if not user_dna.amenities:
        return None
    from pipelines.cleaning.text_cleaning import normalize_key

    wanted = {normalize_key(a): a for a in user_dna.amenities}
    available = {normalize_key(a) for a in property_.amenities}
    matched = [wanted[k] for k in wanted if k in available]
    if not matched:
        return None
    return f"Includes {', '.join(matched)}"


def _explain_transport(user_dna: UserDNA, property_: Property) -> str | None:
    if user_dna.transport_preference is None:
        return None
    metro_km = property_.nearby_facilities.metro_distance_km
    if metro_km is None:
        return None
    if metro_km <= 1.0:
        return "Close to the metro"
    return None


def _explain_investment(user_dna: UserDNA, property_: Property) -> str | None:
    if user_dna.rental_yield_preference is None:
        return None
    if property_.rental_yield is None:
        return None
    if property_.rental_yield >= 7.0:
        return f"High rental potential ({property_.rental_yield:.1f}% yield)"
    return None


_EXPLAINERS = {
    "budget_match": _explain_budget,
    "location_match": _explain_location,
    "property_type_match": _explain_property_type,
    "bedroom_match": _explain_bedrooms,
    "purpose_match": _explain_purpose,
    "transport_match": _explain_transport,
    "investment_match": _explain_investment,
}


def generate_explanation(
    user_dna: UserDNA, property_: Property, match_scores: dict[str, float]
) -> list[str]:
    """Returns a list of short reason strings for the components that scored strongly (>=
    STRONG_MATCH_THRESHOLD) and that the user actually expressed a preference on. Amenities are
    handled separately since a single high overlap score can list multiple matched amenities."""
    reasons: list[str] = []

    for match_type, explainer in _EXPLAINERS.items():
        score = match_scores.get(match_type, NEUTRAL_SCORE)
        if score < STRONG_MATCH_THRESHOLD:
            continue
        reason = explainer(user_dna, property_)
        if reason:
            reasons.append(reason)

    amenity_score = match_scores.get("amenity_match", NEUTRAL_SCORE)
    if amenity_score >= STRONG_MATCH_THRESHOLD:
        amenity_reason = _explain_amenities(user_dna, property_, amenity_score)
        if amenity_reason:
            reasons.append(amenity_reason)

    return reasons


def format_explanation(reasons: list[str]) -> str:
    """Renders the reason list as advisor-style prose with checkmarks, matching the plan's
    example format ('Recommended because: ✓ ...')."""
    if not reasons:
        return "Recommended based on your overall preferences."
    bullets = "\n".join(f"✓ {r}" for r in reasons)
    return f"Recommended because:\n{bullets}"
