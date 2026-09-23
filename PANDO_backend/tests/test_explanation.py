from pipelines.matching.explanation import format_explanation, generate_explanation
from pipelines.matching.scorers import NEUTRAL_SCORE, score_all
from pipelines.schemas.property_schema import NearbyFacilities, Property
from pipelines.schemas.user_dna_schema import (
    Budget,
    Purpose,
    RentalYieldPreference,
    TransportPreference,
    UserDNA,
)


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
        "amenities": ["Gym", "Pool"],
        "property_purpose": ["Investment"],
        "rental_yield": 8.0,
        "nearby_facilities": NearbyFacilities(metro_distance_km=0.5),
    }
    base.update(overrides)
    return Property.model_validate(base)


class TestGenerateExplanation:
    def test_strong_matches_produce_reasons(self):
        dna = UserDNA(
            budget=Budget(min=1_000_000, max=2_000_000),
            locations=["Dubai Marina"],
            bedrooms=2,
            purpose=Purpose.INVESTMENT,
            amenities=["Gym", "Pool"],
            transport_preference=TransportPreference.NEAR_METRO,
            rental_yield_preference=RentalYieldPreference.HIGH,
        )
        prop = make_property()
        scores = score_all(dna, prop)
        reasons = generate_explanation(dna, prop, scores)

        assert any("budget" in r.lower() for r in reasons)
        assert any("Dubai Marina" in r for r in reasons)
        assert any("bedroom" in r.lower() for r in reasons)
        assert any("investment" in r.lower() for r in reasons)
        assert any("Gym" in r and "Pool" in r for r in reasons)
        assert any("metro" in r.lower() for r in reasons)
        assert any("yield" in r.lower() for r in reasons)

    def test_no_stated_preferences_produces_no_reasons(self):
        dna = UserDNA()
        prop = make_property()
        scores = score_all(dna, prop)
        reasons = generate_explanation(dna, prop, scores)
        assert reasons == []

    def test_neutral_score_never_produces_a_reason(self):
        """A component the user never asked about (NEUTRAL_SCORE) must not be praised,
        even though NEUTRAL_SCORE (0.75) is numerically high."""
        dna = UserDNA(locations=["Dubai Marina"])  # only location stated
        prop = make_property()
        scores = score_all(dna, prop)
        assert scores["purpose_match"] == NEUTRAL_SCORE
        reasons = generate_explanation(dna, prop, scores)
        assert not any("investment" in r.lower() or "live in" in r.lower() for r in reasons)

    def test_poor_match_on_stated_preference_produces_no_reason_for_that_component(self):
        dna = UserDNA(locations=["Downtown Dubai"])  # property is in Dubai Marina
        prop = make_property(location="Dubai Marina")
        scores = score_all(dna, prop)
        assert scores["location_match"] == 0.0
        reasons = generate_explanation(dna, prop, scores)
        assert not any("Dubai Marina" in r or "Downtown" in r for r in reasons)

    def test_partial_amenity_match_lists_only_matched_amenities(self):
        dna = UserDNA(amenities=["Gym", "Pool", "Sauna"])
        prop = make_property(amenities=["Gym", "Pool"])  # 2/3 = 0.667, below threshold
        scores = score_all(dna, prop)
        reasons = generate_explanation(dna, prop, scores)
        assert not any("Gym" in r for r in reasons)  # below STRONG_MATCH_THRESHOLD

    def test_full_amenity_match_lists_amenities(self):
        dna = UserDNA(amenities=["Gym", "Pool"])
        prop = make_property(amenities=["Gym", "Pool", "Parking"])
        scores = score_all(dna, prop)
        reasons = generate_explanation(dna, prop, scores)
        assert any("Gym" in r and "Pool" in r for r in reasons)

    def test_property_type_uses_correct_grammatical_article(self):
        dna = UserDNA(property_types=["Apartment"])
        prop = make_property(property_type="Apartment")
        scores = score_all(dna, prop)
        reasons = generate_explanation(dna, prop, scores)
        assert any(r.startswith("An apartment") for r in reasons)

        dna2 = UserDNA(property_types=["Villa"])
        prop2 = make_property(property_type="Villa")
        scores2 = score_all(dna2, prop2)
        reasons2 = generate_explanation(dna2, prop2, scores2)
        assert any(r.startswith("A villa") for r in reasons2)


class TestFormatExplanation:
    def test_formats_with_checkmarks(self):
        text = format_explanation(["Within your budget", "Close to the metro"])
        assert text.startswith("Recommended because:")
        assert "✓ Within your budget" in text
        assert "✓ Close to the metro" in text

    def test_empty_reasons_still_reads_naturally(self):
        text = format_explanation([])
        assert "Recommended based on your overall preferences." == text
        assert "✓" not in text
