from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

from api.db import get_db
from api.main import app

client = TestClient(app)
INTERACTIONS_COLLECTION = "hi_pando_interactions"


@pytest.mark.integration
class TestRecommendationsEndpoint:
    """Requires a live MongoDB connection since the endpoint loads real property data."""

    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_recommendations_with_user_dna(self):
        payload = {
            "user_dna": {
                "budget": {"min": 1_000_000, "max": 2_000_000},
                "locations": ["Dubai Marina"],
                "property_types": ["Apartment"],
                "bedrooms": 2,
            },
            "top_n": 3,
        }
        response = client.post("/recommendations", json=payload)
        assert response.status_code == 200
        body = response.json()
        assert len(body["recommendations"]) <= 3
        assert body["user_dna"]["locations"] == ["Dubai Marina"]
        for rec in body["recommendations"]:
            assert 0.0 <= rec["score"] <= 1.0
            assert "explanation" in rec
            assert set(rec["match_scores"].keys()) == {
                "budget_match", "location_match", "property_type_match", "bedroom_match",
                "purpose_match", "amenity_match", "area_match", "transport_match", "investment_match",
            }

    def test_recommendations_with_conversation_text(self):
        payload = {
            "conversation_text": "I want a 2-bedroom apartment around 1.5 million in Dubai Marina, close to the metro.",
            "top_n": 2,
        }
        response = client.post("/recommendations", json=payload)
        assert response.status_code == 200
        body = response.json()
        assert body["user_dna"]["budget"]["max"] == 1_500_000
        assert body["user_dna"]["bedrooms"] == 2
        assert len(body["recommendations"]) <= 2

    def test_rejects_neither_input(self):
        response = client.post("/recommendations", json={})
        assert response.status_code == 422

    def test_rejects_both_inputs(self):
        payload = {"user_dna": {}, "conversation_text": "hello"}
        response = client.post("/recommendations", json=payload)
        assert response.status_code == 422

    def test_empty_user_dna_still_returns_results(self):
        response = client.post("/recommendations", json={"user_dna": {}, "top_n": 5})
        assert response.status_code == 200
        assert len(response.json()["recommendations"]) == 5

    def test_recommendations_are_sorted_descending(self):
        response = client.post("/recommendations", json={"user_dna": {}, "top_n": 10})
        scores = [r["score"] for r in response.json()["recommendations"]]
        assert scores == sorted(scores, reverse=True)


class TestErrorSanitization:
    """No live DB needed — these mock out the failure point directly."""

    def test_property_load_failure_does_not_leak_internal_details(self):
        with patch("api.main.load_all_properties", side_effect=Exception("mongodb+srv://user:secret@cluster/db")):
            response = client.post("/recommendations", json={"user_dna": {}, "top_n": 5})
        assert response.status_code == 503
        assert "secret" not in response.text
        assert "mongodb" not in response.text.lower()

    def test_unhandled_exception_returns_sanitized_500(self):
        no_raise_client = TestClient(app, raise_server_exceptions=False)
        with patch("api.main.extract_user_dna", side_effect=RuntimeError("internal stack trace detail")):
            response = no_raise_client.post(
                "/recommendations", json={"conversation_text": "hello", "top_n": 5}
            )
        assert response.status_code == 500
        assert response.json() == {"detail": "Internal server error"}
        assert "internal stack trace detail" not in response.text


@pytest.mark.integration
class TestInteractionsEndpoint:
    """Requires a live MongoDB connection — writes real documents to hi_pando_interactions."""

    def _cleanup(self, ids):
        if not ids:
            return
        db = get_db()
        db[INTERACTIONS_COLLECTION].delete_many({"_id": {"$in": [ObjectId(i) for i in ids]}})

    def test_create_interaction_returns_201_and_id(self):
        payload = {
            "userId": "api-test-user",
            "propertyId": "api-test-property",
            "event": "PROPERTY_SAVED",
            "recommendationScore": 0.9,
        }
        response = client.post("/interactions", json=payload)
        try:
            assert response.status_code == 201
            body = response.json()
            assert body["event"]["userId"] == "api-test-user"
            assert body["event"]["event"] == "PROPERTY_SAVED"
            assert "id" in body
        finally:
            self._cleanup([response.json()["id"]] if response.status_code == 201 else [])

    def test_create_interaction_rejects_invalid_event_type(self):
        payload = {"userId": "u", "propertyId": "p", "event": "NOT_REAL"}
        response = client.post("/interactions", json=payload)
        assert response.status_code == 422

    def test_recommendations_with_user_id_logs_property_shown(self):
        payload = {
            "user_id": "shown-test-user",
            "user_dna": {"locations": ["Dubai Marina"]},
            "top_n": 3,
        }
        response = client.post("/recommendations", json=payload)
        assert response.status_code == 200
        returned_ids = {r["property"]["property_id"] for r in response.json()["recommendations"]}

        db = get_db()
        try:
            logged = list(db[INTERACTIONS_COLLECTION].find({"userId": "shown-test-user"}))
            assert len(logged) == len(returned_ids)
            logged_property_ids = {d["propertyId"] for d in logged}
            assert logged_property_ids == returned_ids
            assert all(d["event"] == "PROPERTY_SHOWN" for d in logged)
            assert all(d["recommendationScore"] is not None for d in logged)
        finally:
            db[INTERACTIONS_COLLECTION].delete_many({"userId": "shown-test-user"})

    def test_property_shown_snapshots_user_dna_and_match_scores(self):
        """Phase 3.2 needs a snapshot of UserDNA + match_scores at PROPERTY_SHOWN time to build
        training rows later — confirm it's actually captured, not just the bare event fields."""
        payload = {
            "user_id": "snapshot-test-user",
            "user_dna": {"locations": ["Dubai Marina"], "bedrooms": 2},
            "top_n": 2,
        }
        response = client.post("/recommendations", json=payload)
        assert response.status_code == 200

        db = get_db()
        try:
            logged = list(db[INTERACTIONS_COLLECTION].find({"userId": "snapshot-test-user"}))
            assert len(logged) == 2
            for doc in logged:
                assert doc["userDna"]["locations"] == ["Dubai Marina"]
                assert doc["userDna"]["bedrooms"] == 2
                assert set(doc["matchScores"].keys()) == {
                    "budget_match", "location_match", "property_type_match", "bedroom_match",
                    "purpose_match", "amenity_match", "area_match", "transport_match", "investment_match",
                }
        finally:
            db[INTERACTIONS_COLLECTION].delete_many({"userId": "snapshot-test-user"})

    def test_recommendations_without_user_id_logs_nothing(self):
        response = client.post("/recommendations", json={"user_dna": {}, "top_n": 2})
        assert response.status_code == 200

        db = get_db()
        count_before_marker = db[INTERACTIONS_COLLECTION].count_documents({"userId": {"$exists": False}})
        assert count_before_marker == 0  # no document without a userId should ever exist
