from api.db import get_db
from pipelines.schemas.interaction_schema import InteractionEvent

COLLECTION_NAME = "hi_pando_interactions"


def _to_document(event: InteractionEvent) -> dict:
    """Uses Python-native mode (not JSON mode) so `timestamp` stays a real datetime object —
    pymongo then stores it as a proper BSON date, matching the $jsonSchema validator's
    bsonType: 'date' requirement. JSON mode would serialize it to an ISO string instead,
    which the validator rejects."""
    return event.model_dump(mode="python", by_alias=True)


def log_interaction(event: InteractionEvent) -> str:
    """Writes one interaction event to storage. Returns the inserted document's id as a string."""
    db = get_db()
    result = db[COLLECTION_NAME].insert_one(_to_document(event))
    return str(result.inserted_id)


def log_interactions(events: list[InteractionEvent]) -> list[str]:
    """Bulk-write variant, used when logging PROPERTY_SHOWN for an entire recommendation
    batch in one call rather than one round-trip per property."""
    if not events:
        return []
    db = get_db()
    docs = [_to_document(e) for e in events]
    result = db[COLLECTION_NAME].insert_many(docs)
    return [str(_id) for _id in result.inserted_ids]
