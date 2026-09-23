"""
Phase 3.3 (User Features, behavioral half): derives per-user behavioral signals from their
interaction history — the "Previous interactions", "Average property price viewed", and
"Average property size viewed" features from the plan's User Features list. The other User
Features (Budget range, Preferred locations/type/bedrooms, Investment/end-use preference,
Preferred amenities) are the *stated* UserDNA fields already snapshotted per-interaction in
Phase 3.2's training rows (user_bedrooms, user_budget_min/max, etc.) — nothing new to build
for those; they are UserDNA, not behavior.

"Viewed" here means any interaction at all (PROPERTY_SHOWN included) — the user was exposed to
the property's price/size whether or not they clicked further, so it's the right basis for an
average. A stricter "actually looked at it" signal (PROPERTY_CLICKED/VIEWED) would undercount,
especially early on when most interactions are just PROPERTY_SHOWN.
"""

from datetime import datetime

from api.db import get_db

INTERACTIONS_COLLECTION = "hi_pando_interactions"
PROPERTY_FEATURES_COLLECTION = "hi_pando_property_features"


def compute_user_behavioral_features(user_id: str, before: datetime | None = None) -> dict:
    """
    Aggregates one user's interaction history into behavioral features. `before`, when given,
    restricts to interactions strictly before that timestamp — used when building a training
    row so a feature never leaks information from the future relative to the labeled event it
    describes (e.g. a SAVED event at time T must only see interactions before T).

    Returns 0/None-safe defaults for a user with no prior interactions, rather than raising —
    every real user starts with an empty history at some point.
    """
    db = get_db()

    query: dict = {"userId": user_id}
    if before is not None:
        query["timestamp"] = {"$lt": before}

    interactions = list(db[INTERACTIONS_COLLECTION].find(query, {"propertyId": 1, "_id": 0}))
    previous_interactions_count = len(interactions)

    if not interactions:
        return {
            "user_previous_interactions_count": 0,
            "user_avg_price_viewed": None,
            "user_avg_area_viewed": None,
        }

    property_ids = list({i["propertyId"] for i in interactions})
    features = list(
        db[PROPERTY_FEATURES_COLLECTION].find(
            {"property_id": {"$in": property_ids}},
            {"_id": 0, "price_normalized": 1, "built_up_area_sqft_normalized": 1},
        )
    )

    if not features:
        # Interactions exist but none of the referenced properties have feature rows (e.g.
        # they were removed from the catalog since) — count still reflects real history.
        return {
            "user_previous_interactions_count": previous_interactions_count,
            "user_avg_price_viewed": None,
            "user_avg_area_viewed": None,
        }

    avg_price = sum(f["price_normalized"] for f in features) / len(features)
    avg_area = sum(f["built_up_area_sqft_normalized"] for f in features) / len(features)

    return {
        "user_previous_interactions_count": previous_interactions_count,
        "user_avg_price_viewed": avg_price,
        "user_avg_area_viewed": avg_area,
    }
