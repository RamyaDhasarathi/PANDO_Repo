from datetime import datetime, timezone

import pytest
from bson import ObjectId

from api.db import get_db
from pipelines.interactions.repository import log_interaction, log_interactions
from pipelines.schemas.interaction_schema import InteractionEvent

COLLECTION_NAME = "hi_pando_interactions"


@pytest.mark.integration
class TestLogInteraction:
    """Requires a live MongoDB connection — confirms events are actually written to storage
    correctly with userId, propertyId, event, timestamp, recommendationScore (checklist 3.1.3)."""

    def _cleanup(self, ids):
        db = get_db()
        db[COLLECTION_NAME].delete_many({"_id": {"$in": [ObjectId(i) for i in ids]}})

    def test_single_event_written_correctly(self):
        event = InteractionEvent.model_validate(
            {
                "userId": "test-user-1",
                "propertyId": "test-property-1",
                "event": "PROPERTY_SAVED",
                "recommendationScore": 0.87,
            }
        )
        inserted_id = log_interaction(event)

        db = get_db()
        doc = db[COLLECTION_NAME].find_one({"_id": ObjectId(inserted_id)})

        try:
            assert doc is not None
            assert doc["userId"] == "test-user-1"
            assert doc["propertyId"] == "test-property-1"
            assert doc["event"] == "PROPERTY_SAVED"
            assert doc["recommendationScore"] == 0.87
            assert "timestamp" in doc
        finally:
            self._cleanup([inserted_id])

    def test_bulk_log_writes_all_events(self):
        events = [
            InteractionEvent.model_validate(
                {"userId": "bulk-user", "propertyId": f"P{i}", "event": "PROPERTY_SHOWN", "recommendationScore": 0.5}
            )
            for i in range(5)
        ]
        ids = log_interactions(events)

        try:
            assert len(ids) == 5
            db = get_db()
            count = db[COLLECTION_NAME].count_documents({"userId": "bulk-user"})
            assert count == 5
        finally:
            self._cleanup(ids)

    def test_bulk_log_empty_list_is_noop(self):
        assert log_interactions([]) == []

    def test_mongo_schema_validator_rejects_bad_event_type(self):
        db = get_db()
        with pytest.raises(Exception):
            db[COLLECTION_NAME].insert_one(
                {
                    "userId": "u",
                    "propertyId": "p",
                    "event": "NOT_A_REAL_EVENT",
                    "timestamp": datetime.now(timezone.utc),
                }
            )
