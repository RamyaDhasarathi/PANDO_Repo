"""
Synthetic interaction-data generator, used to cold-start Phase 3.4 (EDA / ML ranking model)
while real frontend traffic accumulates in parallel. Per explicit user decision, documented in
hi-pando-claude-code-checklist.md Phase 3.4: `hi_pando_interactions` is confirmed live-empty, and
this generator provides a stand-in dataset with genuine learnable structure rather than randomly
labeled noise.

This is NOT a shortcut around the Phase 3 "no synthetic interaction data" rule in the way that
rule was meant to prevent (hand-picking labels to make a model look good). Every event emitted
here is produced by the *same* code path a real user's request would hit:
  - personas are ordinary `UserDNA` objects
  - shown properties and their scores come from the real `generate_recommendations()` funnel
    (Phase 2.5) against the real `hi_pando_properties` catalog
  - downstream engagement (click/view/save/reject/...) is a probabilistic function of that real
    score, not an arbitrary label
  - events are written through the same `log_interaction`/`log_interactions` repository
    (Phase 3.1) the FastAPI endpoints use, so schema validation and snapshotting are identical

Every synthetic user gets a `SYNTH-USER-####` id (mirrors the `SYN-####`/`LST-####` property-id
prefix convention from synthetic_property_generator.py / map_listings_to_properties.py), so
synthetic and real interactions can always be told apart later by a simple prefix filter, with no
schema divergence from what the frontend team was given as the `/interactions` contract.

Not a substitute for real user data before Phase 3.5+ model-quality claims or the Phase 3
"live and generating real recommendations" success criterion — this pass exists to validate the
pipeline (EDA, training-dataset construction, feature engineering) end-to-end, not to certify a
production-ready model.
"""

import argparse
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from pipelines.cleaning.amenities import CANONICAL_AMENITIES
from pipelines.cleaning.location import CANONICAL_LOCATIONS
from pipelines.cleaning.property_type import CANONICAL_PROPERTY_TYPES
from pipelines.interactions.repository import log_interactions
from pipelines.matching.candidate_generation import RankedProperty, generate_recommendations
from pipelines.matching.repository import load_all_properties
from pipelines.schemas.interaction_schema import InteractionEvent, InteractionEventType
from pipelines.schemas.user_dna_schema import (
    Budget,
    Purpose,
    RentalYieldPreference,
    TransportPreference,
    UserDNA,
)

USER_ID_PREFIX = "SYNTH-USER"

# Hand-designed archetypes spanning the real UserDNA field space, so personas are coherent
# (a Marina investor persona behaves like one across every session) rather than fully random
# noise. Each generated persona jitters an archetype's budget/bedrooms rather than reusing it
# verbatim, so N personas aren't just copies of these ~10 templates.
_PERSONA_ARCHETYPES = [
    {"budget": (1_500_000, 2_500_000), "bedrooms": 1, "purpose": Purpose.INVESTMENT,
     "locations": ["Dubai Marina", "Jumeirah Lake Towers"], "property_types": ["Apartment"],
     "rental_yield_preference": RentalYieldPreference.HIGH},
    {"budget": (2_500_000, 4_000_000), "bedrooms": 3, "purpose": Purpose.END_USE,
     "locations": ["Dubai Hills Estate", "Arabian Ranches"], "property_types": ["Villa", "Townhouse"],
     "transport_preference": TransportPreference.NO_PREFERENCE},
    {"budget": (800_000, 1_400_000), "bedrooms": 0, "purpose": Purpose.RENTAL,
     "locations": ["Business Bay", "Downtown Dubai"], "property_types": ["Studio", "Apartment"],
     "transport_preference": TransportPreference.NEAR_METRO},
    {"budget": (5_000_000, 9_000_000), "bedrooms": 4, "purpose": Purpose.END_USE,
     "locations": ["Palm Jumeirah", "Dubai Creek Harbour"], "property_types": ["Penthouse", "Villa"],
     "rental_yield_preference": RentalYieldPreference.NO_PREFERENCE},
    {"budget": (1_000_000, 1_800_000), "bedrooms": 2, "purpose": Purpose.INVESTMENT,
     "locations": ["Jumeirah Village Circle", "Al Barsha"], "property_types": ["Apartment"],
     "rental_yield_preference": RentalYieldPreference.HIGH},
    {"budget": (2_000_000, 3_000_000), "bedrooms": 2, "purpose": Purpose.END_USE,
     "locations": ["Dubai Sports City", "Dubai Silicon Oasis"], "property_types": ["Apartment", "Duplex"],
     "transport_preference": TransportPreference.NEAR_METRO},
    {"budget": (3_000_000, 5_000_000), "bedrooms": 3, "purpose": Purpose.INVESTMENT,
     "locations": ["Jumeirah Beach Residence", "Dubai Marina"], "property_types": ["Apartment", "Duplex"],
     "rental_yield_preference": RentalYieldPreference.MEDIUM},
    {"budget": (900_000, 1_600_000), "bedrooms": 1, "purpose": Purpose.RENTAL,
     "locations": ["Mirdif", "Dubai South"], "property_types": ["Apartment"],
     "transport_preference": TransportPreference.NO_PREFERENCE},
    {"budget": (4_000_000, 7_000_000), "bedrooms": 4, "purpose": Purpose.END_USE,
     "locations": ["Dubai Hills Estate", "Downtown Dubai"], "property_types": ["Villa", "Penthouse"],
     "rental_yield_preference": RentalYieldPreference.LOW},
    {"budget": (1_200_000, 2_000_000), "bedrooms": 2, "purpose": Purpose.INVESTMENT,
     "locations": ["Business Bay", "Downtown Dubai"], "property_types": ["Apartment"],
     "transport_preference": TransportPreference.NEAR_METRO,
     "rental_yield_preference": RentalYieldPreference.MEDIUM},
]

# Base probability of progressing from one funnel stage to the next, plus how strongly the
# property's total match score pulls that probability up (positive stages) or down (rejection).
# These constants are what gives the dataset learnable structure: a 0.9-score property should
# end up positively-labeled far more often than a 0.2-score one, on average across many personas.
_BASE_CLICK_PROB = 0.25
_SCORE_CLICK_WEIGHT = 0.55
_BASE_SAVE_PROB = 0.10
_SCORE_SAVE_WEIGHT = 0.65
_BASE_SHORTLIST_PROB = 0.35  # conditional on already having saved
_SCORE_SHORTLIST_WEIGHT = 0.45
_BASE_BROKER_PROB = 0.30  # conditional on having shortlisted
_BASE_VIEWING_PROB = 0.25  # conditional on having shortlisted
_BASE_REJECT_PROB = 0.45
_SCORE_REJECT_WEIGHT = 0.60  # subtracted: high score -> lower reject chance


@dataclass
class SimulatedSession:
    user_id: str
    user_dna: UserDNA
    events: list[InteractionEvent] = field(default_factory=list)


def generate_persona(rng: random.Random) -> UserDNA:
    """Builds one randomized-but-coherent persona by jittering a hand-designed archetype."""
    archetype = rng.choice(_PERSONA_ARCHETYPES)

    budget_low, budget_high = archetype["budget"]
    jitter = rng.uniform(0.85, 1.15)
    budget = Budget(min=round(budget_low * jitter, -3), max=round(budget_high * jitter, -3))

    bedrooms = max(0, archetype["bedrooms"] + rng.choice([-1, 0, 0, 0, 1]))

    amenity_pool = archetype.get("amenities") or CANONICAL_AMENITIES
    amenities = rng.sample(amenity_pool, k=rng.randint(0, min(3, len(amenity_pool))))

    return UserDNA(
        budget=budget,
        locations=list(archetype["locations"]),
        property_types=list(archetype["property_types"]),
        bedrooms=bedrooms,
        purpose=archetype["purpose"],
        amenities=amenities,
        transport_preference=archetype.get("transport_preference"),
        rental_yield_preference=archetype.get("rental_yield_preference"),
    )


def _jittered_timestamp(base: datetime, rng: random.Random, min_minutes: float, max_minutes: float) -> datetime:
    return base + timedelta(minutes=rng.uniform(min_minutes, max_minutes))


def _simulate_property_funnel(
    user_id: str,
    ranked: RankedProperty,
    shown_at: datetime,
    rng: random.Random,
) -> list[InteractionEvent]:
    """Walks one shown property through a score-conditioned funnel: click -> view -> (save ->
    shortlist -> broker-contact/viewing-request) or an early reject. Only one terminal
    label-bearing event is ever emitted per property per session (Phase 3.2's labels.py treats
    SAVED/SHORTLISTED/BROKER_CONTACTED/VIEWING_REQUESTED as Positive and REJECTED as Negative —
    a session shouldn't emit contradictory labels for the same property)."""
    score = ranked.score
    events: list[InteractionEvent] = []
    last_ts = shown_at

    def _emit(event_type: InteractionEventType, ts: datetime) -> None:
        events.append(
            InteractionEvent(
                userId=user_id,
                propertyId=ranked.property.property_id,
                event=event_type,
                timestamp=ts,
                recommendationScore=score,
            )
        )

    click_prob = min(0.98, _BASE_CLICK_PROB + _SCORE_CLICK_WEIGHT * score)
    if rng.random() > click_prob:
        # Never clicked -- shown-only, no label. Small chance of an outright reject without a
        # click (a user scanning a results page can reject on sight from the card alone).
        if rng.random() < max(0.0, _BASE_REJECT_PROB - _SCORE_REJECT_WEIGHT * score) * 0.3:
            _emit(InteractionEventType.PROPERTY_REJECTED, _jittered_timestamp(last_ts, rng, 0.1, 2))
        return events

    last_ts = _jittered_timestamp(last_ts, rng, 0.2, 5)
    _emit(InteractionEventType.PROPERTY_CLICKED, last_ts)

    last_ts = _jittered_timestamp(last_ts, rng, 0.5, 8)
    _emit(InteractionEventType.PROPERTY_VIEWED, last_ts)

    reject_prob = max(0.0, _BASE_REJECT_PROB - _SCORE_REJECT_WEIGHT * score)
    if rng.random() < reject_prob:
        last_ts = _jittered_timestamp(last_ts, rng, 0.1, 3)
        _emit(InteractionEventType.PROPERTY_REJECTED, last_ts)
        return events

    save_prob = min(0.95, _BASE_SAVE_PROB + _SCORE_SAVE_WEIGHT * score)
    if rng.random() > save_prob:
        return events  # viewed but neither saved nor rejected -- ambiguous, excluded from labels

    last_ts = _jittered_timestamp(last_ts, rng, 0.2, 10)
    _emit(InteractionEventType.PROPERTY_SAVED, last_ts)

    shortlist_prob = min(0.95, _BASE_SHORTLIST_PROB + _SCORE_SHORTLIST_WEIGHT * score)
    if rng.random() > shortlist_prob:
        return events

    last_ts = _jittered_timestamp(last_ts, rng, 1, 60)
    _emit(InteractionEventType.PROPERTY_SHORTLISTED, last_ts)

    # From shortlisted, at most one of broker-contact / viewing-request (independent rolls,
    # first one to hit wins -- a user typically takes one next concrete step, not both at once).
    if rng.random() < _BASE_BROKER_PROB:
        last_ts = _jittered_timestamp(last_ts, rng, 5, 240)
        _emit(InteractionEventType.BROKER_CONTACTED, last_ts)
    elif rng.random() < _BASE_VIEWING_PROB:
        last_ts = _jittered_timestamp(last_ts, rng, 5, 240)
        _emit(InteractionEventType.VIEWING_REQUESTED, last_ts)

    return events


def simulate_session(
    user_id: str,
    user_dna: UserDNA,
    properties: list,
    rng: random.Random,
    top_n: int = 10,
) -> list[InteractionEvent]:
    """One persona's full session: real recommendation funnel -> PROPERTY_SHOWN per result ->
    per-property engagement simulation. Returns every event generated, PROPERTY_SHOWN included."""
    ranked = generate_recommendations(user_dna, properties, top_n=top_n)
    if not ranked:
        return []

    shown_at = datetime.now(timezone.utc) - timedelta(days=rng.uniform(0, 30))
    events: list[InteractionEvent] = []

    for item in ranked:
        events.append(
            InteractionEvent(
                userId=user_id,
                propertyId=item.property.property_id,
                event=InteractionEventType.PROPERTY_SHOWN,
                timestamp=shown_at,
                recommendationScore=item.score,
                userDna=user_dna,
                matchScores=item.match_scores,
            )
        )
        events.extend(_simulate_property_funnel(user_id, item, shown_at, rng))

    return events


def run(num_users: int, sessions_per_user: int, top_n: int, seed: int | None, dry_run: bool = False) -> None:
    rng = random.Random(seed)
    properties = load_all_properties()

    if not properties:
        print("No properties found in hi_pando_properties -- nothing to recommend against.")
        return

    all_events: list[InteractionEvent] = []
    event_type_counts: dict[str, int] = {}

    for user_index in range(1, num_users + 1):
        user_id = f"{USER_ID_PREFIX}-{user_index:04d}"
        persona = generate_persona(rng)
        for _ in range(sessions_per_user):
            session_events = simulate_session(user_id, persona, properties, rng, top_n=top_n)
            all_events.extend(session_events)
            for event in session_events:
                event_type_counts[event.event.value] = event_type_counts.get(event.event.value, 0) + 1

    print(f"Simulated {num_users} users x {sessions_per_user} sessions -> {len(all_events)} events.")
    for event_type, count in sorted(event_type_counts.items()):
        print(f"  {event_type}: {count}")

    if dry_run:
        print("Dry run: no events written.")
        return

    inserted_ids = log_interactions(all_events)
    print(f"Inserted {len(inserted_ids)} events into hi_pando_interactions.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate synthetic user-interaction data to cold-start Phase 3.4."
    )
    parser.add_argument("--num-users", type=int, default=150, help="Number of synthetic personas.")
    parser.add_argument("--sessions-per-user", type=int, default=3, help="Recommendation sessions per persona.")
    parser.add_argument("--top-n", type=int, default=10, help="Properties shown per session.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without writing to MongoDB.")
    args = parser.parse_args()
    run(
        num_users=args.num_users,
        sessions_per_user=args.sessions_per_user,
        top_n=args.top_n,
        seed=args.seed,
        dry_run=args.dry_run,
    )
