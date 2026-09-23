import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from api.db import ping
from api.schemas import (
    InteractionEventResponse,
    RecommendationItem,
    RecommendationRequest,
    RecommendationResponse,
)
from pipelines.extraction.pipeline import extract_user_dna
from pipelines.interactions.repository import log_interaction, log_interactions
from pipelines.matching.candidate_generation import generate_recommendations
from pipelines.matching.explanation import format_explanation, generate_explanation
from pipelines.matching.repository import load_all_properties
from pipelines.matching.weighted_scoring import load_weights
from pipelines.schemas.interaction_schema import InteractionEvent, InteractionEventType

logger = logging.getLogger("hi_pando.api")

app = FastAPI(title="Hi Pando Recommendation Engine")

_weights = load_weights()


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catches anything not already an HTTPException so callers never see a raw traceback
    or internal details (e.g. a DB connection string embedded in a driver error message).
    The real exception is still logged server-side for debugging."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
def health():
    db_status = "ok"
    try:
        ping()
    except Exception:
        logger.exception("Health check DB ping failed")
        db_status = "error"

    return {"status": "ok", "db": db_status}


@app.post("/recommendations", response_model=RecommendationResponse)
def recommendations(request: RecommendationRequest):
    user_dna = request.user_dna if request.user_dna is not None else extract_user_dna(request.conversation_text)

    try:
        properties = load_all_properties()
    except Exception:
        logger.exception("Failed to load property data")
        raise HTTPException(status_code=503, detail="Could not load property data")

    if not properties:
        raise HTTPException(status_code=503, detail="No property data available")

    ranked = generate_recommendations(user_dna, properties, top_n=request.top_n, weights=_weights)

    items = [
        RecommendationItem(
            property=r.property,
            score=r.score,
            match_scores=r.match_scores,
            explanation=format_explanation(generate_explanation(user_dna, r.property, r.match_scores)),
        )
        for r in ranked
    ]

    if request.user_id is not None and items:
        shown_events = [
            InteractionEvent(
                userId=request.user_id,
                propertyId=item.property.property_id,
                event=InteractionEventType.PROPERTY_SHOWN,
                recommendationScore=item.score,
                userDna=user_dna,
                matchScores=item.match_scores,
            )
            for item in items
        ]
        try:
            log_interactions(shown_events)
        except Exception:
            # Never let interaction-logging failures break the recommendation response itself —
            # the recommendations are still valid even if this write failed.
            logger.exception("Failed to log PROPERTY_SHOWN interactions")

    return RecommendationResponse(user_dna=user_dna, recommendations=items)


@app.post("/interactions", response_model=InteractionEventResponse, status_code=201)
def create_interaction(event: InteractionEvent):
    """Records one user-property interaction event (Phase 3.1). Used for every event type
    other than PROPERTY_SHOWN, which /recommendations logs automatically when user_id is given."""
    try:
        inserted_id = log_interaction(event)
    except Exception:
        logger.exception("Failed to log interaction event")
        raise HTTPException(status_code=503, detail="Could not record interaction")

    return InteractionEventResponse(id=inserted_id, event=event)
