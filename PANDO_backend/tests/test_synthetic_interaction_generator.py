import random

import pytest

from pipelines.matching.candidate_generation import RankedProperty
from pipelines.schemas.interaction_schema import InteractionEvent, InteractionEventType
from pipelines.schemas.property_schema import Property
from pipelines.schemas.user_dna_schema import UserDNA
from pipelines.synthetic_interaction_generator import (
    USER_ID_PREFIX,
    _simulate_property_funnel,
    generate_persona,
    simulate_session,
)
from pipelines.training.labels import is_trainable_event, label_for_event
from datetime import datetime, timezone


def make_property(**overrides) -> Property:
    base = {
        "property_id": "P1",
        "property_name": "Test Property",
        "property_type": "Apartment",
        "location": "Dubai Marina",
        "listing_purpose": "Sale",
        "price": 1_500_000,
        "bedrooms": 2,
        "bathrooms": 2,
        "built_up_area_sqft": 1000,
        "completion_status": "Ready",
    }
    base.update(overrides)
    return Property.model_validate(base)


def make_ranked(score: float, property_id: str = "P1") -> RankedProperty:
    return RankedProperty(
        property=make_property(property_id=property_id),
        score=score,
        match_scores={"budget_match": score},
    )


class TestGeneratePersona:
    def test_returns_valid_user_dna(self):
        rng = random.Random(1)
        persona = generate_persona(rng)
        assert isinstance(persona, UserDNA)
        assert persona.budget is not None
        assert persona.budget.min <= persona.budget.max
        assert persona.bedrooms >= 0

    def test_varies_across_calls(self):
        rng = random.Random(2)
        personas = [generate_persona(rng) for _ in range(20)]
        budgets = {(p.budget.min, p.budget.max) for p in personas}
        assert len(budgets) > 1  # jitter + archetype variety produces more than one distinct budget


class TestSimulatePropertyFunnel:
    def test_high_score_never_produces_reject_only(self):
        """Across many trials, a very high score should predominantly lead to a positive
        terminal event (or no terminal event), essentially never straight to REJECTED."""
        rng = random.Random(3)
        reject_count = 0
        positive_count = 0
        trials = 300
        for _ in range(trials):
            ranked = make_ranked(score=0.97)
            events = _simulate_property_funnel("user", ranked, datetime.now(timezone.utc), rng)
            event_types = [e.event for e in events]
            if InteractionEventType.PROPERTY_REJECTED in event_types:
                reject_count += 1
            if any(is_trainable_event(t) and label_for_event(t) == "Positive" for t in event_types):
                positive_count += 1
        assert reject_count < trials * 0.1
        assert positive_count > trials * 0.4

    def test_low_score_rejects_more_than_high_score(self):
        """Score-conditioned probabilities: a poor match should be rejected more often, on
        average, than a strong match -- this is what gives the dataset learnable signal."""
        rng = random.Random(4)
        trials = 400

        def reject_rate(score: float) -> float:
            rejects = 0
            for _ in range(trials):
                ranked = make_ranked(score=score)
                events = _simulate_property_funnel("user", ranked, datetime.now(timezone.utc), rng)
                if any(e.event == InteractionEventType.PROPERTY_REJECTED for e in events):
                    rejects += 1
            return rejects / trials

        low_rate = reject_rate(0.2)
        high_rate = reject_rate(0.95)
        assert low_rate > high_rate

    def test_only_one_terminal_label_per_property(self):
        """A single simulated funnel run must never emit both a Positive-labeled event and
        PROPERTY_REJECTED for the same property -- labels.py treats these as mutually exclusive
        outcomes, and a session emitting both would corrupt the training label for that row."""
        rng = random.Random(5)
        for _ in range(200):
            ranked = make_ranked(score=rng.uniform(0.1, 0.99))
            events = _simulate_property_funnel("user", ranked, datetime.now(timezone.utc), rng)
            labels = {label_for_event(e.event) for e in events if is_trainable_event(e.event)}
            labels.discard(None)
            assert len(labels) <= 1

    def test_all_emitted_events_are_valid(self):
        rng = random.Random(6)
        ranked = make_ranked(score=0.8)
        events = _simulate_property_funnel("user-1", ranked, datetime.now(timezone.utc), rng)
        for event in events:
            assert isinstance(event, InteractionEvent)
            assert event.user_id == "user-1"
            assert event.property_id == "P1"


class TestSimulateSession:
    def test_produces_shown_event_per_recommended_property(self):
        rng = random.Random(7)
        persona = generate_persona(rng)
        # Built to satisfy pre_filter_candidates for any archetype: matches the persona's
        # stated location/type/purpose/budget so the funnel isn't filtered down to zero.
        is_rent = persona.purpose is not None and persona.purpose.value == "Rental"
        mid_budget = ((persona.budget.min or 0) + (persona.budget.max or 5_000_000)) / 2 or 1_500_000
        properties = [
            make_property(
                property_id=f"P{i}",
                location=persona.locations[0] if persona.locations else "Dubai Marina",
                property_type=persona.property_types[0] if persona.property_types else "Apartment",
                listing_purpose="Rent" if is_rent else "Sale",
                price=None if is_rent else mid_budget + i * 10_000,
                rent_price=mid_budget + i * 10_000 if is_rent else None,
                bedrooms=persona.bedrooms if persona.bedrooms is not None else 2,
            )
            for i in range(15)
        ]
        events = simulate_session(f"{USER_ID_PREFIX}-0001", persona, properties, rng, top_n=5)
        shown = [e for e in events if e.event == InteractionEventType.PROPERTY_SHOWN]
        assert 0 < len(shown) <= 5
        for event in shown:
            assert event.recommendation_score is not None
            assert event.match_scores is not None
            assert event.user_dna == persona

    def test_empty_property_list_produces_no_events(self):
        rng = random.Random(8)
        persona = generate_persona(rng)
        events = simulate_session(f"{USER_ID_PREFIX}-0002", persona, [], rng, top_n=5)
        assert events == []
