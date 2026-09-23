from pipelines.schemas.interaction_schema import InteractionEventType
from pipelines.training.labels import NEGATIVE, POSITIVE, is_trainable_event, label_for_event


class TestLabelForEvent:
    def test_positive_events(self):
        for event_type in [
            InteractionEventType.PROPERTY_SAVED,
            InteractionEventType.PROPERTY_SHORTLISTED,
            InteractionEventType.BROKER_CONTACTED,
            InteractionEventType.VIEWING_REQUESTED,
        ]:
            assert label_for_event(event_type) == POSITIVE, event_type

    def test_negative_event(self):
        assert label_for_event(InteractionEventType.PROPERTY_REJECTED) == NEGATIVE

    def test_weak_signal_events_are_unlabeled(self):
        for event_type in [
            InteractionEventType.PROPERTY_SHOWN,
            InteractionEventType.PROPERTY_CLICKED,
            InteractionEventType.PROPERTY_VIEWED,
        ]:
            assert label_for_event(event_type) is None, event_type

    def test_every_event_type_is_covered_by_the_mapping_decision(self):
        """Every InteractionEventType must be a deliberate decision (labeled or explicitly
        excluded), not an oversight — this test fails loudly if a new event type is ever added
        to the enum without updating labels.py."""
        for event_type in InteractionEventType:
            # Just confirms label_for_event doesn't raise for any enum member.
            label_for_event(event_type)


class TestIsTrainableEvent:
    def test_positive_and_negative_are_trainable(self):
        assert is_trainable_event(InteractionEventType.PROPERTY_SAVED) is True
        assert is_trainable_event(InteractionEventType.PROPERTY_REJECTED) is True

    def test_weak_signals_are_not_trainable(self):
        assert is_trainable_event(InteractionEventType.PROPERTY_SHOWN) is False
        assert is_trainable_event(InteractionEventType.PROPERTY_CLICKED) is False
        assert is_trainable_event(InteractionEventType.PROPERTY_VIEWED) is False
