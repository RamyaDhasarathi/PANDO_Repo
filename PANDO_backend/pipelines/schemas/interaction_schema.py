from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from pipelines.schemas.user_dna_schema import UserDNA


class InteractionEventType(str, Enum):
    PROPERTY_SHOWN = "PROPERTY_SHOWN"
    PROPERTY_CLICKED = "PROPERTY_CLICKED"
    PROPERTY_VIEWED = "PROPERTY_VIEWED"
    PROPERTY_SAVED = "PROPERTY_SAVED"
    PROPERTY_SHORTLISTED = "PROPERTY_SHORTLISTED"
    PROPERTY_REJECTED = "PROPERTY_REJECTED"
    BROKER_CONTACTED = "BROKER_CONTACTED"
    VIEWING_REQUESTED = "VIEWING_REQUESTED"


class InteractionEvent(BaseModel):
    """
    One user-property interaction event (Phase 3.1). `recommendationScore` is the score the
    recommendation engine assigned this property at the time it was shown/acted on — required
    for PROPERTY_SHOWN (that's exactly what it records) and optional for every other event type,
    since a later action (e.g. PROPERTY_SAVED) may not always have the original score at hand
    when the client fires it.

    `userDna` and `matchScores` are a snapshot of what the recommendation engine knew at the
    moment this property was shown — captured automatically by /recommendations on
    PROPERTY_SHOWN (Phase 3.1 wiring). Without this snapshot, Phase 3.2's training-row builder
    would have no way to reconstruct "what did this user want" or "why was this property scored
    the way it was" from stored interactions alone, since UserDNA is never otherwise persisted.
    Both are optional because non-PROPERTY_SHOWN events (e.g. a later PROPERTY_SAVED) may be
    fired by a client that doesn't have this context to hand — the training pipeline joins back
    to the PROPERTY_SHOWN event for the same user+property when it needs this snapshot.
    """

    user_id: str = Field(..., alias="userId")
    property_id: str = Field(..., alias="propertyId")
    event: InteractionEventType
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    recommendation_score: Optional[float] = Field(None, ge=0, le=1, alias="recommendationScore")
    user_dna: Optional[UserDNA] = Field(None, alias="userDna")
    match_scores: Optional[dict[str, float]] = Field(None, alias="matchScores")

    model_config = {"populate_by_name": True}
