from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from pipelines.schemas.interaction_schema import InteractionEvent, InteractionEventType


class TestInteractionEventSchema:
    def test_valid_event_with_all_fields(self):
        event = InteractionEvent.model_validate(
            {
                "userId": "U123",
                "propertyId": "P456",
                "event": "PROPERTY_SAVED",
                "recommendationScore": 0.87,
            }
        )
        assert event.user_id == "U123"
        assert event.property_id == "P456"
        assert event.event == InteractionEventType.PROPERTY_SAVED
        assert event.recommendation_score == 0.87
        assert isinstance(event.timestamp, datetime)

    def test_timestamp_defaults_to_now_utc(self):
        before = datetime.now(timezone.utc)
        event = InteractionEvent.model_validate(
            {"userId": "U1", "propertyId": "P1", "event": "PROPERTY_VIEWED"}
        )
        after = datetime.now(timezone.utc)
        assert before <= event.timestamp <= after

    def test_recommendation_score_optional(self):
        event = InteractionEvent.model_validate(
            {"userId": "U1", "propertyId": "P1", "event": "BROKER_CONTACTED"}
        )
        assert event.recommendation_score is None

    def test_all_eight_event_types_accepted(self):
        expected = {
            "PROPERTY_SHOWN", "PROPERTY_CLICKED", "PROPERTY_VIEWED", "PROPERTY_SAVED",
            "PROPERTY_SHORTLISTED", "PROPERTY_REJECTED", "BROKER_CONTACTED", "VIEWING_REQUESTED",
        }
        assert {e.value for e in InteractionEventType} == expected

    def test_invalid_event_type_rejected(self):
        with pytest.raises(ValidationError):
            InteractionEvent.model_validate(
                {"userId": "U1", "propertyId": "P1", "event": "PROPERTY_LIKED"}
            )

    def test_score_out_of_range_rejected(self):
        with pytest.raises(ValidationError):
            InteractionEvent.model_validate(
                {"userId": "U1", "propertyId": "P1", "event": "PROPERTY_SHOWN", "recommendationScore": 1.5}
            )

    def test_missing_required_field_rejected(self):
        with pytest.raises(ValidationError):
            InteractionEvent.model_validate({"propertyId": "P1", "event": "PROPERTY_SHOWN"})

    def test_snake_case_field_names_also_accepted(self):
        """model_config populate_by_name=True — accepts both the camelCase alias and the
        Python-facing snake_case name, useful for internal callers constructing events directly."""
        event = InteractionEvent(user_id="U1", property_id="P1", event="PROPERTY_VIEWED")
        assert event.user_id == "U1"

    def test_serializes_with_camel_case_aliases(self):
        event = InteractionEvent.model_validate(
            {"userId": "U1", "propertyId": "P1", "event": "PROPERTY_SHOWN", "recommendationScore": 0.9}
        )
        dumped = event.model_dump(mode="json", by_alias=True)
        assert dumped["userId"] == "U1"
        assert dumped["propertyId"] == "P1"
        assert dumped["recommendationScore"] == 0.9
