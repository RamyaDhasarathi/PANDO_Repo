from dataclasses import dataclass

from pipelines.cleaning.text_cleaning import normalize_key
from pipelines.matching.property_category import property_category as _property_category
from pipelines.matching.weighted_scoring import compute_recommendation_score, load_weights
from pipelines.schemas.property_schema import ListingPurpose, Property
from pipelines.schemas.user_dna_schema import Purpose, UserDNA

# How far outside the user's stated budget a property may still be pre-filtered in as a
# candidate, before feature matching gets a chance to score it. Wider than the scorer's own
# overage tolerance so a strong match on other criteria can still surface a slightly-over-budget
# property; the scorer itself is what penalizes the overage in the final ranking.
_PRE_FILTER_BUDGET_TOLERANCE = 0.5

# Rule-based hard exclusion (Phase 2.5 decision: a fundamental category mismatch should
# disqualify a candidate outright rather than just lose points on one of 9 weighted scorers).
# Commercial properties are additionally excluded entirely at the repository layer (Hi Pando
# is residential-only for now) — this filter mainly guards residential-vs-residential category
# confusion and stays as defense-in-depth. To be replaced with an LLM-based judgment call later.


@dataclass
class RankedProperty:
    property: Property
    score: float
    match_scores: dict[str, float]


def _property_price(property_: Property) -> float | None:
    return property_.price if property_.listing_purpose.value == "Sale" else property_.rent_price


def _property_purpose_conflicts(user_dna: UserDNA, property_: Property) -> bool:
    """True if the user's stated intent to buy vs. rent directly contradicts the property's
    listing_purpose — e.g. wanting to buy a home to live in, but the property is rent-only."""
    if user_dna.purpose is None:
        return False
    wants_to_buy = user_dna.purpose in (Purpose.INVESTMENT, Purpose.END_USE)
    wants_to_rent = user_dna.purpose == Purpose.RENTAL
    if wants_to_buy and property_.listing_purpose == ListingPurpose.RENT:
        return True
    if wants_to_rent and property_.listing_purpose == ListingPurpose.SALE:
        return True
    return False


def _property_type_conflicts(user_dna: UserDNA, property_: Property) -> bool:
    """True if every property type the user asked for is in a different category
    (residential/commercial) than this property — a hard mismatch, not a soft one."""
    if not user_dna.property_types:
        return False
    property_category = _property_category(property_.property_type)
    if property_category is None:
        return False
    wanted_categories = {_property_category(t) for t in user_dna.property_types}
    wanted_categories.discard(None)
    if not wanted_categories:
        return False
    return property_category not in wanted_categories


def pre_filter_candidates(user_dna: UserDNA, properties: list[Property]) -> list[Property]:
    """Cut the full property set down to plausible candidates before the more expensive
    per-property feature scoring runs. Two kinds of exclusion:
    - soft-adjacent (budget/location): excludes only when clearly outside a stated preference,
      with tolerance, since scoring can still penalize a near-miss gracefully.
    - hard rule-based (purpose conflict, property category conflict): excludes outright,
      since no amount of budget/location/amenity strength should let a rent-only listing
      outrank a for-sale one for a buyer, or a retail shop outrank an apartment for someone
      wanting residential housing. Intentionally simple/rule-based for now — to be replaced
      with an LLM-based judgment call later.
    """
    candidates = [
        p
        for p in properties
        if not _property_purpose_conflicts(user_dna, p) and not _property_type_conflicts(user_dna, p)
    ]

    if user_dna.budget is not None and (user_dna.budget.min is not None or user_dna.budget.max is not None):
        low = user_dna.budget.min
        high = user_dna.budget.max
        budget_filtered = []
        for p in candidates:
            price = _property_price(p)
            if price is None:
                budget_filtered.append(p)  # can't judge — don't exclude on missing data
                continue
            if low is not None and price < low * (1 - _PRE_FILTER_BUDGET_TOLERANCE):
                continue
            if high is not None and price > high * (1 + _PRE_FILTER_BUDGET_TOLERANCE):
                continue
            budget_filtered.append(p)
        candidates = budget_filtered

    if user_dna.locations:
        wanted = {normalize_key(loc) for loc in user_dna.locations}
        candidates = [p for p in candidates if normalize_key(p.location) in wanted]

    return candidates


def score_and_rank(
    user_dna: UserDNA, candidates: list[Property], weights: dict[str, float] | None = None
) -> list[RankedProperty]:
    if weights is None:
        weights = load_weights()

    ranked = []
    for prop in candidates:
        total, components = compute_recommendation_score(user_dna, prop, weights)
        ranked.append(RankedProperty(property=prop, score=total, match_scores=components))

    ranked.sort(key=lambda r: r.score, reverse=True)
    return ranked


def generate_recommendations(
    user_dna: UserDNA,
    properties: list[Property],
    top_n: int = 10,
    weights: dict[str, float] | None = None,
) -> list[RankedProperty]:
    """Full candidate -> score -> rank -> top-N pipeline (Phase 2.5)."""
    candidates = pre_filter_candidates(user_dna, properties)
    ranked = score_and_rank(user_dna, candidates, weights=weights)
    return ranked[:top_n]
