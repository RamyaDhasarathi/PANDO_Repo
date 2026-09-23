from pipelines.extraction.budget import extract_budget
from pipelines.extraction.categorical import (
    extract_amenities,
    extract_bedrooms,
    extract_locations,
    extract_property_types,
    extract_purpose,
    extract_rental_yield_preference,
    extract_transport_preference,
)
from pipelines.schemas.user_dna_schema import UserDNA


def extract_user_dna(conversation_text: str) -> UserDNA:
    """
    Rule-based extraction of a UserDNA profile from free-form conversation text.

    Deterministic and keyword/pattern-based rather than LLM-based (see Phase 2.2 decision):
    no external API dependency, fully unit-testable, zero latency/cost. Every field is
    independently extracted and left None/empty when nothing in the text matches — a missing
    field means "not stated," not "no preference," and downstream feature matching (2.3)
    treats that as neutral rather than penalizing it.

    `conversation_text` may be the whole conversation transcript concatenated, or a single
    message — extraction runs the same regardless, since each extractor scans the full string.
    """
    return UserDNA(
        budget=extract_budget(conversation_text),
        locations=extract_locations(conversation_text),
        property_types=extract_property_types(conversation_text),
        bedrooms=extract_bedrooms(conversation_text),
        purpose=extract_purpose(conversation_text),
        amenities=extract_amenities(conversation_text),
        transport_preference=extract_transport_preference(conversation_text),
        rental_yield_preference=extract_rental_yield_preference(conversation_text),
    )
