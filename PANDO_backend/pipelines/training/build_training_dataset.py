"""
Phase 3.2: joins user features + property features + interaction context + outcome into
training rows.

    User Features + Property Features + Interaction Context + Historical Outcome
    -> one row per labeled interaction

Row shape (flat dict, one row per labeled interaction event):
    user_id, property_id, timestamp        -- identity/context, not model inputs
    label                                    -- 'Positive' | 'Negative' (see labels.py)
    event                                    -- the raw event type that produced the label
    <property feature columns>               -- from hi_pando_property_features (Phase 1.3,
                                                 reused as-is — see Phase 3.3 note below)
    match_<name>                             -- the 9 Phase 2.3 match-score components,
                                                 snapshotted at PROPERTY_SHOWN time (the
                                                 "Interaction Context" in the plan's example —
                                                 Location Match, etc.)
    user_bedrooms, user_budget_min, user_budget_max  -- a few raw UserDNA fields worth having
                                                 directly, mirroring the plan's example
                                                 ("User Budget = 1.5M", "User Bedrooms = 2")
    user_previous_interactions_count,
    user_avg_price_viewed, user_avg_area_viewed      -- Phase 3.3 behavioral (User) features,
                                                 computed strictly before this row's timestamp
                                                 so no feature ever leaks future information
    price_difference, budget_compatibility,
    location_similarity, property_type_match,
    bedroom_difference, amenity_similarity,
    historical_user_interest, distance_preference,
    investment_compatibility                  -- Phase 3.3 User x Property features

Only interactions whose event type has a defined label are included (see
labels.is_trainable_event) — PROPERTY_SHOWN/CLICKED/VIEWED never produce a training row on
their own, they only supply the context snapshot a later labeled event joins back to.

Phase 3.3 note on property-side features: the plan's "Property Features" list (Price, Bedrooms,
Property type, Location, Rental yield, Area, Amenities, Developer, Distance to metro,
Completion status) is already fully covered by Phase 1.3's `hi_pando_property_features` — this
pipeline reuses that collection directly (see the property-feature columns above) rather than
re-deriving any of it, satisfying the checklist's "confirm reusable without duplication" item.
"""

import bisect
from collections import defaultdict

from api.db import get_db
from pipelines.schemas.interaction_schema import InteractionEventType
from pipelines.training.interaction_features import compute_interaction_features
from pipelines.training.labels import label_for_event

INTERACTIONS_COLLECTION = "hi_pando_interactions"
PROPERTIES_COLLECTION = "hi_pando_properties"
PROPERTY_FEATURES_COLLECTION = "hi_pando_property_features"

_LABELED_EVENT_TYPES = [
    InteractionEventType.PROPERTY_SAVED.value,
    InteractionEventType.PROPERTY_SHORTLISTED.value,
    InteractionEventType.BROKER_CONTACTED.value,
    InteractionEventType.VIEWING_REQUESTED.value,
    InteractionEventType.PROPERTY_REJECTED.value,
]


def _behavioral_features_from_history(
    user_history: list[dict], before, property_features_by_id: dict
) -> dict:
    """In-memory equivalent of behavioral_features.compute_user_behavioral_features, given a
    user's full interaction history (already sorted/loaded once — see build_training_dataset)
    instead of re-querying MongoDB per row. Same 'any interaction counts as viewed' and
    strict-before-cutoff semantics as the original."""
    prior = [h for h in user_history if h["timestamp"] < before]
    count = len(prior)
    if not prior:
        return {
            "user_previous_interactions_count": 0,
            "user_avg_price_viewed": None,
            "user_avg_area_viewed": None,
        }

    prices, areas = [], []
    for h in prior:
        features = property_features_by_id.get(h["propertyId"])
        if features is None:
            continue
        prices.append(features["price_normalized"])
        areas.append(features["built_up_area_sqft_normalized"])

    if not prices:
        return {
            "user_previous_interactions_count": count,
            "user_avg_price_viewed": None,
            "user_avg_area_viewed": None,
        }

    return {
        "user_previous_interactions_count": count,
        "user_avg_price_viewed": sum(prices) / len(prices),
        "user_avg_area_viewed": sum(areas) / len(areas),
    }


def _prior_labeled_history_for_join(
    user_labeled_history: list[dict], before, exclude_property_id: str, properties_by_id: dict
) -> list[dict]:
    """In-memory equivalent of the original Mongo-per-row join: this user's labeled interactions
    strictly before `before`, excluding the row's own property, enriched with each property's
    location/property_type for compute_historical_user_interest."""
    history = []
    for h in user_labeled_history:
        if h["timestamp"] >= before or h["propertyId"] == exclude_property_id:
            continue
        prop = properties_by_id.get(h["propertyId"])
        history.append(
            {
                "propertyId": h["propertyId"],
                "label": label_for_event(InteractionEventType(h["event"])),
                "location": prop.get("location") if prop else None,
                "property_type": prop.get("property_type") if prop else None,
            }
        )
    return history


def build_training_dataset() -> list[dict]:
    """
    Builds the Phase 3.2 training rows. Optimized to load the (small, static) properties and
    property-features collections once and each user's interaction history once, then does all
    per-row lookups in memory — the original per-row Mongo query pattern (property lookup +
    property-features lookup + a behavioral-features query + a history-join query, all inside
    the row loop) meant ~6 sequential network round-trips per labeled row, which made this take
    minutes against Atlas for a dataset in the low thousands of rows. This version issues a
    small constant number of bulk queries instead.
    """
    db = get_db()

    labeled_events = list(
        db[INTERACTIONS_COLLECTION].find({"event": {"$in": _LABELED_EVENT_TYPES}})
    )
    if not labeled_events:
        return []

    user_ids = list({e["userId"] for e in labeled_events})

    # All PROPERTY_SHOWN events for these users, needed to reconstruct the userDna/matchScores
    # snapshot for labeled events that didn't carry one inline (see build_training_dataset's
    # original _find_shown_snapshot). Sorted per (user, property) so the "most recent at or
    # before timestamp" lookup can be done with a binary search instead of a query.
    shown_events = list(
        db[INTERACTIONS_COLLECTION].find(
            {"userId": {"$in": user_ids}, "event": InteractionEventType.PROPERTY_SHOWN.value}
        )
    )
    shown_by_user_property: dict[tuple, list[dict]] = defaultdict(list)
    for e in shown_events:
        shown_by_user_property[(e["userId"], e["propertyId"])].append(e)
    for key in shown_by_user_property:
        shown_by_user_property[key].sort(key=lambda e: e["timestamp"])

    def find_shown_snapshot(user_id: str, property_id: str, before) -> dict | None:
        candidates = shown_by_user_property.get((user_id, property_id))
        if not candidates:
            return None
        timestamps = [c["timestamp"] for c in candidates]
        idx = bisect.bisect_right(timestamps, before) - 1
        return candidates[idx] if idx >= 0 else None

    # Every user's full labeled-interaction history (for the User x Property "historical
    # interest" join) and full interaction history (for behavioral features), loaded once.
    all_user_events = list(db[INTERACTIONS_COLLECTION].find({"userId": {"$in": user_ids}}))
    all_history_by_user: dict[str, list[dict]] = defaultdict(list)
    labeled_history_by_user: dict[str, list[dict]] = defaultdict(list)
    for e in all_user_events:
        all_history_by_user[e["userId"]].append(e)
        if e["event"] in _LABELED_EVENT_TYPES:
            labeled_history_by_user[e["userId"]].append(e)

    properties_by_id = {p["property_id"]: p for p in db[PROPERTIES_COLLECTION].find({}, {"_id": 0})}
    property_features_by_id = {
        f["property_id"]: f for f in db[PROPERTY_FEATURES_COLLECTION].find({}, {"_id": 0})
    }

    rows = []
    skipped_no_snapshot = 0

    for interaction in labeled_events:
        label = label_for_event(InteractionEventType(interaction["event"]))
        if label is None:
            continue  # defensive — the query above already filters to labeled types only

        user_id = interaction["userId"]
        property_id = interaction["propertyId"]
        timestamp = interaction["timestamp"]

        snapshot = (
            interaction
            if interaction.get("userDna") is not None
            else find_shown_snapshot(user_id, property_id, timestamp)
        )

        property_features = property_features_by_id.get(property_id)
        property_doc = properties_by_id.get(property_id)

        if snapshot is None or property_features is None or property_doc is None:
            # Can't build a meaningful row without knowing what the user wanted or what the
            # property looked like — skip rather than fabricate placeholder context.
            skipped_no_snapshot += 1
            continue

        user_dna = snapshot.get("userDna") or {}
        match_scores = snapshot.get("matchScores") or {}
        budget = user_dna.get("budget") or {}

        row = {
            "user_id": user_id,
            "property_id": property_id,
            "timestamp": timestamp,
            "event": interaction["event"],
            "label": label,
            "user_bedrooms": user_dna.get("bedrooms"),
            "user_budget_min": budget.get("min"),
            "user_budget_max": budget.get("max"),
        }
        row.update({f"match_{name}": score for name, score in match_scores.items()})
        row.update({k: v for k, v in property_features.items() if k != "property_id"})

        # Phase 3.3 behavioral (user-side) features — cut off strictly before this row's own
        # timestamp so the row never learns from its own outcome or from the future.
        row.update(
            _behavioral_features_from_history(
                all_history_by_user.get(user_id, []), timestamp, property_features_by_id
            )
        )

        # Phase 3.3 User x Property features
        history = _prior_labeled_history_for_join(
            labeled_history_by_user.get(user_id, []), timestamp, property_id, properties_by_id
        )
        row.update(
            compute_interaction_features(user_id, user_dna, property_doc, match_scores, history)
        )

        rows.append(row)

    if skipped_no_snapshot:
        print(
            f"Skipped {skipped_no_snapshot} labeled interaction(s) with no PROPERTY_SHOWN "
            "snapshot or missing property features — cannot build a training row without them."
        )

    return rows


def run() -> None:
    rows = build_training_dataset()
    print(f"Built {len(rows)} training rows from labeled interactions.")
    if rows:
        positive = sum(1 for r in rows if r["label"] == "Positive")
        negative = len(rows) - positive
        print(f"  Positive: {positive}, Negative: {negative}")


if __name__ == "__main__":
    run()
