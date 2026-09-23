from datetime import datetime, timedelta, timezone

import pytest
from bson import ObjectId

from api.db import get_db
from pipelines.training.build_training_dataset import build_training_dataset

INTERACTIONS_COLLECTION = "hi_pando_interactions"


@pytest.mark.integration
class TestBuildTrainingDataset:
    """Requires a live MongoDB connection — seeds real interaction documents (using a real
    property_id from hi_pando_properties/hi_pando_property_features so the property-feature
    join actually resolves), runs the pipeline, and cleans up afterward."""

    @pytest.fixture
    def real_property_id(self):
        db = get_db()
        doc = db["hi_pando_properties"].find_one({}, {"property_id": 1})
        assert doc is not None, "hi_pando_properties must be populated for this test to run"
        return doc["property_id"]

    def _cleanup(self, user_id):
        db = get_db()
        db[INTERACTIONS_COLLECTION].delete_many({"userId": user_id})

    def test_saved_event_produces_a_positive_training_row(self, real_property_id):
        db = get_db()
        user_id = "training-test-user-1"
        shown_time = datetime.now(timezone.utc)
        saved_time = shown_time + timedelta(minutes=2)

        db[INTERACTIONS_COLLECTION].insert_one({
            "userId": user_id,
            "propertyId": real_property_id,
            "event": "PROPERTY_SHOWN",
            "timestamp": shown_time,
            "recommendationScore": 0.91,
            "userDna": {"bedrooms": 2, "budget": {"min": 1_000_000, "max": 2_000_000}, "locations": [], "property_types": [], "amenities": []},
            "matchScores": {
                "budget_match": 1.0, "location_match": 1.0, "property_type_match": 1.0,
                "bedroom_match": 1.0, "purpose_match": 0.75, "amenity_match": 0.75,
                "area_match": 0.75, "transport_match": 0.75, "investment_match": 0.75,
            },
        })
        db[INTERACTIONS_COLLECTION].insert_one({
            "userId": user_id,
            "propertyId": real_property_id,
            "event": "PROPERTY_SAVED",
            "timestamp": saved_time,
        })

        try:
            rows = build_training_dataset()
            matching = [r for r in rows if r["user_id"] == user_id]
            assert len(matching) == 1
            row = matching[0]
            assert row["label"] == "Positive"
            assert row["event"] == "PROPERTY_SAVED"
            assert row["property_id"] == real_property_id
            assert row["user_bedrooms"] == 2
            assert row["user_budget_min"] == 1_000_000
            assert row["user_budget_max"] == 2_000_000
            assert row["match_location_match"] == 1.0
            # property feature columns joined in from hi_pando_property_features
            assert "price_normalized" in row
            assert "bedrooms" in row
        finally:
            self._cleanup(user_id)

    def test_rejected_event_produces_a_negative_training_row(self, real_property_id):
        db = get_db()
        user_id = "training-test-user-2"
        now = datetime.now(timezone.utc)

        db[INTERACTIONS_COLLECTION].insert_one({
            "userId": user_id, "propertyId": real_property_id, "event": "PROPERTY_SHOWN",
            "timestamp": now, "recommendationScore": 0.4,
            "userDna": {"bedrooms": None, "budget": None, "locations": [], "property_types": [], "amenities": []},
            "matchScores": {k: 0.5 for k in [
                "budget_match", "location_match", "property_type_match", "bedroom_match",
                "purpose_match", "amenity_match", "area_match", "transport_match", "investment_match",
            ]},
        })
        db[INTERACTIONS_COLLECTION].insert_one({
            "userId": user_id, "propertyId": real_property_id, "event": "PROPERTY_REJECTED",
            "timestamp": now + timedelta(minutes=1),
        })

        try:
            rows = build_training_dataset()
            matching = [r for r in rows if r["user_id"] == user_id]
            assert len(matching) == 1
            assert matching[0]["label"] == "Negative"
        finally:
            self._cleanup(user_id)

    def test_shown_clicked_viewed_alone_produce_no_training_rows(self, real_property_id):
        db = get_db()
        user_id = "training-test-user-3"
        now = datetime.now(timezone.utc)

        for event_type in ["PROPERTY_SHOWN", "PROPERTY_CLICKED", "PROPERTY_VIEWED"]:
            db[INTERACTIONS_COLLECTION].insert_one({
                "userId": user_id, "propertyId": real_property_id, "event": event_type,
                "timestamp": now,
            })

        try:
            rows = build_training_dataset()
            matching = [r for r in rows if r["user_id"] == user_id]
            assert matching == []
        finally:
            self._cleanup(user_id)

    def test_labeled_event_with_no_shown_snapshot_is_skipped(self, real_property_id):
        """A SAVED event with no prior PROPERTY_SHOWN to snapshot from can't be turned into a
        meaningful training row — it must be skipped, not fabricated."""
        db = get_db()
        user_id = "training-test-user-4"

        db[INTERACTIONS_COLLECTION].insert_one({
            "userId": user_id, "propertyId": real_property_id, "event": "PROPERTY_SAVED",
            "timestamp": datetime.now(timezone.utc),
        })

        try:
            rows = build_training_dataset()
            matching = [r for r in rows if r["user_id"] == user_id]
            assert matching == []
        finally:
            self._cleanup(user_id)

    def test_own_snapshot_used_when_labeled_event_carries_one_directly(self, real_property_id):
        """If the labeled event itself carries userDna/matchScores (e.g. a client that has
        them at hand), use that directly rather than requiring a separate PROPERTY_SHOWN."""
        db = get_db()
        user_id = "training-test-user-5"

        db[INTERACTIONS_COLLECTION].insert_one({
            "userId": user_id, "propertyId": real_property_id, "event": "PROPERTY_SHORTLISTED",
            "timestamp": datetime.now(timezone.utc),
            "userDna": {"bedrooms": 3, "budget": None, "locations": [], "property_types": [], "amenities": []},
            "matchScores": {k: 0.6 for k in [
                "budget_match", "location_match", "property_type_match", "bedroom_match",
                "purpose_match", "amenity_match", "area_match", "transport_match", "investment_match",
            ]},
        })

        try:
            rows = build_training_dataset()
            matching = [r for r in rows if r["user_id"] == user_id]
            assert len(matching) == 1
            assert matching[0]["label"] == "Positive"
            assert matching[0]["user_bedrooms"] == 3
        finally:
            self._cleanup(user_id)

    def test_row_includes_phase_3_3_behavioral_and_interaction_features(self, real_property_id):
        db = get_db()
        user_id = "training-test-user-6"
        shown_time = datetime.now(timezone.utc)
        saved_time = shown_time + timedelta(minutes=2)

        db[INTERACTIONS_COLLECTION].insert_one({
            "userId": user_id, "propertyId": real_property_id, "event": "PROPERTY_SHOWN",
            "timestamp": shown_time, "recommendationScore": 0.8,
            "userDna": {
                "bedrooms": 2, "budget": {"min": 1_000_000, "max": 2_000_000},
                "locations": [], "property_types": [], "amenities": ["Gym"],
                "rental_yield_preference": "High",
            },
            "matchScores": {
                "budget_match": 1.0, "location_match": 1.0, "property_type_match": 1.0,
                "bedroom_match": 1.0, "purpose_match": 0.75, "amenity_match": 0.75,
                "area_match": 0.75, "transport_match": 0.75, "investment_match": 0.75,
            },
        })
        db[INTERACTIONS_COLLECTION].insert_one({
            "userId": user_id, "propertyId": real_property_id, "event": "PROPERTY_SAVED",
            "timestamp": saved_time,
        })

        try:
            rows = build_training_dataset()
            matching = [r for r in rows if r["user_id"] == user_id]
            assert len(matching) == 1
            row = matching[0]

            # behavioral (user-side) features
            assert row["user_previous_interactions_count"] == 1  # the PROPERTY_SHOWN, before cutoff
            assert row["user_avg_price_viewed"] is not None
            assert row["user_avg_area_viewed"] is not None

            # user x property interaction features
            assert "price_difference" in row
            assert "budget_compatibility" in row
            assert row["location_similarity"] == 1.0  # reused from match_scores
            assert row["property_type_match"] == 1.0  # reused from match_scores
            assert "bedroom_difference" in row
            assert "amenity_similarity" in row
            assert "distance_preference" in row
            assert "investment_compatibility" in row
            assert row["historical_user_interest"] == 0.0  # no prior labeled interactions yet
        finally:
            self._cleanup(user_id)

    def test_historical_user_interest_reflects_prior_positive_interaction(self, real_property_id):
        """A user who previously SAVED some property, then later interacts with a DIFFERENT
        property in the same location, should show historical_user_interest == 0.5 on the
        second row (same-location positive history), not 0.0."""
        db = get_db()
        user_id = "training-test-user-7"
        t0 = datetime.now(timezone.utc)

        real_prop = db["hi_pando_properties"].find_one({"property_id": real_property_id})
        other_prop = db["hi_pando_properties"].find_one(
            {"location": real_prop["location"], "property_id": {"$ne": real_property_id}}
        )
        if other_prop is None:
            pytest.skip("No second property in the same location exists in the current dataset")

        db[INTERACTIONS_COLLECTION].insert_one({
            "userId": user_id, "propertyId": real_property_id, "event": "PROPERTY_SAVED",
            "timestamp": t0,
            "userDna": {"bedrooms": None, "budget": None, "locations": [], "property_types": [], "amenities": []},
            "matchScores": {k: 0.6 for k in [
                "budget_match", "location_match", "property_type_match", "bedroom_match",
                "purpose_match", "amenity_match", "area_match", "transport_match", "investment_match",
            ]},
        })
        db[INTERACTIONS_COLLECTION].insert_one({
            "userId": user_id, "propertyId": other_prop["property_id"], "event": "PROPERTY_SHORTLISTED",
            "timestamp": t0 + timedelta(minutes=5),
            "userDna": {"bedrooms": None, "budget": None, "locations": [], "property_types": [], "amenities": []},
            "matchScores": {k: 0.6 for k in [
                "budget_match", "location_match", "property_type_match", "bedroom_match",
                "purpose_match", "amenity_match", "area_match", "transport_match", "investment_match",
            ]},
        })

        try:
            rows = build_training_dataset()
            matching = {r["property_id"]: r for r in rows if r["user_id"] == user_id}
            assert matching[real_property_id]["historical_user_interest"] == 0.0  # nothing prior
            assert matching[other_prop["property_id"]]["historical_user_interest"] == 0.5
        finally:
            self._cleanup(user_id)
