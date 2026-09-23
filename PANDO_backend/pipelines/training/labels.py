"""
Phase 3.2 label assignment: maps each interaction event type to a training label.

Per user decision, a conservative "standard engagement-funnel" mapping:
- POSITIVE: deliberate, effortful actions that signal real interest (SAVED, SHORTLISTED,
  BROKER_CONTACTED, VIEWING_REQUESTED).
- NEGATIVE: an explicit negative signal (REJECTED).
- None (excluded from training): SHOWN, CLICKED, VIEWED — too weak/ambiguous alone to serve as
  a binary label (a click or view doesn't reliably mean interest or disinterest by itself).
  These events still matter as *context* (e.g. establishing that a property was shown before
  a later action), just not as the row that gets labeled.
"""

from pipelines.schemas.interaction_schema import InteractionEventType

POSITIVE = "Positive"
NEGATIVE = "Negative"

_LABEL_BY_EVENT_TYPE: dict[InteractionEventType, str] = {
    InteractionEventType.PROPERTY_SAVED: POSITIVE,
    InteractionEventType.PROPERTY_SHORTLISTED: POSITIVE,
    InteractionEventType.BROKER_CONTACTED: POSITIVE,
    InteractionEventType.VIEWING_REQUESTED: POSITIVE,
    InteractionEventType.PROPERTY_REJECTED: NEGATIVE,
    # PROPERTY_SHOWN, PROPERTY_CLICKED, PROPERTY_VIEWED intentionally absent — excluded from
    # training labels (see module docstring).
}


def label_for_event(event_type: InteractionEventType) -> str | None:
    """Returns 'Positive', 'Negative', or None (event type is not used as a training label)."""
    return _LABEL_BY_EVENT_TYPE.get(event_type)


def is_trainable_event(event_type: InteractionEventType) -> bool:
    return event_type in _LABEL_BY_EVENT_TYPE
