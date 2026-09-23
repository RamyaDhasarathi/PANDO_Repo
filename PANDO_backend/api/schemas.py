from typing import Optional

from pydantic import BaseModel, Field, model_validator

from pipelines.schemas.interaction_schema import InteractionEvent
from pipelines.schemas.property_schema import Property
from pipelines.schemas.user_dna_schema import UserDNA


class RecommendationRequest(BaseModel):
    """Accepts either a pre-built UserDNA object or raw conversation text to extract one from
    (Phase 2.2's rule-based extractor) — exactly one of the two must be given.

    `user_id` is optional: when given, every returned property is logged as a PROPERTY_SHOWN
    interaction event (Phase 3.1) attributed to that user. When omitted (anonymous/exploratory
    calls), no interaction is logged — we never invent a placeholder id just to have one."""

    user_dna: Optional[UserDNA] = None
    conversation_text: Optional[str] = None
    top_n: int = Field(10, ge=1, le=100)
    user_id: Optional[str] = None

    @model_validator(mode="after")
    def _check_exactly_one_input(self) -> "RecommendationRequest":
        if (self.user_dna is None) == (self.conversation_text is None):
            raise ValueError("Provide exactly one of user_dna or conversation_text")
        return self


class RecommendationItem(BaseModel):
    property: Property
    score: float
    match_scores: dict[str, float]
    explanation: str


class RecommendationResponse(BaseModel):
    user_dna: UserDNA
    recommendations: list[RecommendationItem]


class InteractionEventResponse(BaseModel):
    id: str
    event: InteractionEvent
