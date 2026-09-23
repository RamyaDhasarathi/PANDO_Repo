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

from api.db import get_db
from pipelines.schemas.interaction_schema import InteractionEventType
from pipelines.training.behavioral_features import compute_user_behavioral_features
from pipelines.training.interaction_features import compute_interaction_features
from pipelines.training.labels import label_for_event

INTERACTIONS_COLLECTION = "hi_pando_interactions"
PROPERTIES_COLLECTION = "hi_pando_properties"
PROPERTY_FEATURES_COLLECTION = "hi_pando_property_features"


def _find_shown_snapshot(db, user_id: str, property_id: str, before) -> dict | None:
    """Finds the most recent PROPERTY_SHOWN event for this user+property pair at or before
    the labeled interaction's timestamp — that's the recommendation context the user was
    actually reacting to."""
    return db[INTERACTIONS_COLLECTION].find_one(
        {
            "userId": user_id,
            "propertyId": property_id,
            "event": InteractionEventType.PROPERTY_SHOWN.value,
            "timestamp": {"$lte": before},
        },
        sort=[("timestamp", -1)],
    )


def _prior_labeled_history_for_join(db, user_id: str, before, exclude_property_id: str) -> list[dict]:
    """Builds the (propertyId, label, location, property_type) history that
    compute_historical_user_interest needs, restricted to interactions strictly before `before`
    (no future leakage) and excluding the property this row is itself about (a row must not use
    its own outcome as a feature)."""
    prior_labeled = list(
        db[INTERACTIONS_COLLECTION].find(
            {
                "userId": user_id,
                "timestamp": {"$lt": before},
                "propertyId": {"$ne": exclude_property_id},
                "event": {
                    "$in": [
                        InteractionEventType.PROPERTY_SAVED.value,
                        InteractionEventType.PROPERTY_SHORTLISTED.value,
                        InteractionEventType.BROKER_CONTACTED.value,
                        InteractionEventType.VIEWING_REQUESTED.value,
                        InteractionEventType.PROPERTY_REJECTED.value,
                    ]
                },
            },
            {"propertyId": 1, "event": 1, "_id": 0},
        )
    )
    if not prior_labeled:
        return []

    property_ids = list({h["propertyId"] for h in prior_labeled})
    property_docs = {
        p["property_id"]: p
        for p in db[PROPERTIES_COLLECTION].find(
            {"property_id": {"$in": property_ids}}, {"property_id": 1, "location": 1, "property_type": 1}
        )
    }

    history = []
    for h in prior_labeled:
        prop = property_docs.get(h["propertyId"])
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
    db = get_db()

    labeled_events = list(
        db[INTERACTIONS_COLLECTION].find(
            {
                "event": {
                    "$in": [
                        InteractionEventType.PROPERTY_SAVED.value,
                        InteractionEventType.PROPERTY_SHORTLISTED.value,
                        InteractionEventType.BROKER_CONTACTED.value,
                        InteractionEventType.VIEWING_REQUESTED.value,
                        InteractionEventType.PROPERTY_REJECTED.value,
                    ]
                }
            }
        )
    )

    rows = []
    skipped_no_snapshot = 0

    for interaction in labeled_events:
        label = label_for_event(InteractionEventType(interaction["event"]))
        if label is None:
            continue  # defensive — the query above already filters to labeled types only

        user_id = interaction["userId"]
        property_id = interaction["propertyId"]
        timestamp = interaction["timestamp"]

        snapshot = interaction if interaction.get("userDna") is not None else _find_shown_snapshot(
            db, user_id, property_id, timestamp
        )

        property_features = db[PROPERTY_FEATURES_COLLECTION].find_one(
            {"property_id": property_id}, {"_id": 0}
        )
        property_doc = db[PROPERTIES_COLLECTION].find_one({"property_id": property_id}, {"_id": 0})

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
        row.update(compute_user_behavioral_features(user_id, before=timestamp))

        # Phase 3.3 User x Property features
        history = _prior_labeled_history_for_join(db, user_id, timestamp, exclude_property_id=property_id)
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
