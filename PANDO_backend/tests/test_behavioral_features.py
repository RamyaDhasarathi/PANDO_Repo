from datetime import datetime, timedelta, timezone

import pytest

from api.db import get_db
from pipelines.training.behavioral_features import compute_user_behavioral_features

INTERACTIONS_COLLECTION = "hi_pando_interactions"


@pytest.mark.integration
class TestComputeUserBehavioralFeatures:
    @pytest.fixture
    def two_real_property_ids(self):
        db = get_db()
        docs = list(db["hi_pando_properties"].find({}, {"property_id": 1}).limit(2))
        assert len(docs) == 2
        return [d["property_id"] for d in docs]

    def _cleanup(self, user_id):
        db = get_db()
        db[INTERACTIONS_COLLECTION].delete_many({"userId": user_id})

    def test_no_history_returns_safe_defaults(self):
        result = compute_user_behavioral_features("nonexistent-user-xyz")
        assert result["user_previous_interactions_count"] == 0
        assert result["user_avg_price_viewed"] is None
        assert result["user_avg_area_viewed"] is None

    def test_counts_and_averages_across_viewed_properties(self, two_real_property_ids):
        db = get_db()
        user_id = "behavioral-test-user-1"
        now = datetime.now(timezone.utc)

        for pid in two_real_property_ids:
            db[INTERACTIONS_COLLECTION].insert_one(
                {"userId": user_id, "propertyId": pid, "event": "PROPERTY_SHOWN", "timestamp": now}
            )

        try:
            result = compute_user_behavioral_features(user_id)
            assert result["user_previous_interactions_count"] == 2
            assert result["user_avg_price_viewed"] is not None
            assert 0.0 <= result["user_avg_price_viewed"] <= 1.0
            assert result["user_avg_area_viewed"] is not None
        finally:
            self._cleanup(user_id)

    def test_before_cutoff_excludes_future_interactions(self, two_real_property_ids):
        """A training row for an event at time T must never see interactions from after T —
        otherwise the feature would leak future information into a historical row."""
        db = get_db()
        user_id = "behavioral-test-user-2"
        cutoff = datetime.now(timezone.utc)

        db[INTERACTIONS_COLLECTION].insert_one(
            {"userId": user_id, "propertyId": two_real_property_ids[0], "event": "PROPERTY_SHOWN",
             "timestamp": cutoff - timedelta(minutes=10)}
        )
        db[INTERACTIONS_COLLECTION].insert_one(
            {"userId": user_id, "propertyId": two_real_property_ids[1], "event": "PROPERTY_SHOWN",
             "timestamp": cutoff + timedelta(minutes=10)}
        )

        try:
            result = compute_user_behavioral_features(user_id, before=cutoff)
            assert result["user_previous_interactions_count"] == 1
        finally:
            self._cleanup(user_id)

    def test_repeated_property_counts_each_interaction(self, two_real_property_ids):
        db = get_db()
        user_id = "behavioral-test-user-3"
        now = datetime.now(timezone.utc)
        pid = two_real_property_ids[0]

        for _ in range(3):
            db[INTERACTIONS_COLLECTION].insert_one(
                {"userId": user_id, "propertyId": pid, "event": "PROPERTY_VIEWED", "timestamp": now}
            )

        try:
            result = compute_user_behavioral_features(user_id)
            assert result["user_previous_interactions_count"] == 3
        finally:
            self._cleanup(user_id)
