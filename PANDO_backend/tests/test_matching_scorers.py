import pytest

from pipelines.matching.scorers import (
    ALL_SCORERS,
    NEUTRAL_SCORE,
    score_all,
    score_amenity_match,
    score_area_match,
    score_bedroom_match,
    score_budget_match,
    score_investment_match,
    score_location_match,
    score_property_type_match,
    score_purpose_match,
    score_transport_match,
)
from pipelines.schemas.property_schema import NearbyFacilities, Property
from pipelines.schemas.user_dna_schema import Budget, Purpose, RentalYieldPreference, TransportPreference, UserDNA


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
        "rental_yield": 6.0,
    }
    base.update(overrides)
    return Property.model_validate(base)


class TestBudgetMatch:
    def test_within_budget_scores_1(self):
        dna = UserDNA(budget=Budget(min=1_000_000, max=2_000_000))
        assert score_budget_match(dna, make_property(price=1_500_000)) == 1.0

    def test_no_budget_stated_is_neutral(self):
        dna = UserDNA()
        assert score_budget_match(dna, make_property()) == NEUTRAL_SCORE

    def test_slightly_over_budget_partial_score(self):
        dna = UserDNA(budget=Budget(max=1_000_000))
        score = score_budget_match(dna, make_property(price=1_100_000))
        assert 0.0 < score < 1.0

    def test_way_over_budget_scores_0(self):
        dna = UserDNA(budget=Budget(max=1_000_000))
        score = score_budget_match(dna, make_property(price=10_000_000))
        assert score == 0.0

    def test_below_min_budget_partial_score(self):
        dna = UserDNA(budget=Budget(min=1_000_000))
        score = score_budget_match(dna, make_property(price=800_000))
        assert 0.0 < score < 1.0

    def test_rent_listing_uses_rent_price(self):
        dna = UserDNA(budget=Budget(max=150_000))
        prop = make_property(listing_purpose="Rent", price=None, rent_price=120_000)
        assert score_budget_match(dna, prop) == 1.0

    def test_score_bounded_0_to_1(self):
        dna = UserDNA(budget=Budget(max=100))
        score = score_budget_match(dna, make_property(price=100_000_000))
        assert 0.0 <= score <= 1.0


class TestLocationMatch:
    def test_matching_location(self):
        dna = UserDNA(locations=["Dubai Marina"])
        assert score_location_match(dna, make_property(location="Dubai Marina")) == 1.0

    def test_non_matching_location(self):
        dna = UserDNA(locations=["Downtown Dubai"])
        assert score_location_match(dna, make_property(location="Dubai Marina")) == 0.0

    def test_no_location_stated_is_neutral(self):
        assert score_location_match(UserDNA(), make_property()) == NEUTRAL_SCORE

    def test_case_insensitive_match(self):
        dna = UserDNA(locations=["dubai marina"])
        assert score_location_match(dna, make_property(location="Dubai Marina")) == 1.0


class TestPropertyTypeMatch:
    def test_matching_type(self):
        dna = UserDNA(property_types=["Apartment"])
        assert score_property_type_match(dna, make_property(property_type="Apartment")) == 1.0

    def test_non_matching_type(self):
        dna = UserDNA(property_types=["Villa"])
        assert score_property_type_match(dna, make_property(property_type="Apartment")) == 0.0

    def test_no_type_stated_is_neutral(self):
        assert score_property_type_match(UserDNA(), make_property()) == NEUTRAL_SCORE


class TestBedroomMatch:
    def test_exact_match(self):
        dna = UserDNA(bedrooms=2)
        assert score_bedroom_match(dna, make_property(bedrooms=2)) == 1.0

    def test_off_by_one_partial_score(self):
        dna = UserDNA(bedrooms=2)
        score = score_bedroom_match(dna, make_property(bedrooms=3))
        assert 0.0 < score < 1.0

    def test_far_off_scores_0(self):
        dna = UserDNA(bedrooms=1)
        score = score_bedroom_match(dna, make_property(bedrooms=10))
        assert score == 0.0

    def test_no_bedroom_stated_is_neutral(self):
        assert score_bedroom_match(UserDNA(), make_property()) == NEUTRAL_SCORE


class TestPurposeMatch:
    def test_matching_purpose(self):
        dna = UserDNA(purpose=Purpose.INVESTMENT)
        prop = make_property(property_purpose=["Investment", "Rental"])
        assert score_purpose_match(dna, prop) == 1.0

    def test_non_matching_purpose(self):
        dna = UserDNA(purpose=Purpose.END_USE)
        prop = make_property(property_purpose=["Investment"])
        assert score_purpose_match(dna, prop) == 0.0

    def test_no_purpose_stated_is_neutral(self):
        assert score_purpose_match(UserDNA(), make_property()) == NEUTRAL_SCORE


class TestAmenityMatch:
    def test_full_overlap(self):
        dna = UserDNA(amenities=["Gym", "Pool"])
        prop = make_property(amenities=["Gym", "Pool", "Parking"])
        assert score_amenity_match(dna, prop) == 1.0

    def test_partial_overlap(self):
        dna = UserDNA(amenities=["Gym", "Pool", "Sauna"])
        prop = make_property(amenities=["Gym"])
        score = score_amenity_match(dna, prop)
        assert score == pytest.approx(1 / 3)

    def test_no_overlap(self):
        dna = UserDNA(amenities=["Sauna"])
        prop = make_property(amenities=["Gym", "Pool"])
        assert score_amenity_match(dna, prop) == 0.0

    def test_no_amenities_stated_is_neutral(self):
        assert score_amenity_match(UserDNA(), make_property()) == NEUTRAL_SCORE


class TestAreaMatch:
    def test_always_neutral(self):
        """No area preference field exists in UserDNA yet — always neutral (Phase 2.3 decision)."""
        assert score_area_match(UserDNA(), make_property()) == NEUTRAL_SCORE
        assert score_area_match(UserDNA(bedrooms=5), make_property(built_up_area_sqft=50)) == NEUTRAL_SCORE


class TestTransportMatch:
    def test_very_close_to_metro_scores_1(self):
        dna = UserDNA(transport_preference=TransportPreference.NEAR_METRO)
        prop = make_property(nearby_facilities=NearbyFacilities(metro_distance_km=0.3))
        assert score_transport_match(dna, prop) == 1.0

    def test_far_from_metro_scores_0(self):
        dna = UserDNA(transport_preference=TransportPreference.NEAR_METRO)
        prop = make_property(nearby_facilities=NearbyFacilities(metro_distance_km=10))
        assert score_transport_match(dna, prop) == 0.0

    def test_no_transport_preference_is_neutral(self):
        assert score_transport_match(UserDNA(), make_property()) == NEUTRAL_SCORE

    def test_unknown_metro_distance_is_neutral(self):
        dna = UserDNA(transport_preference=TransportPreference.NEAR_METRO)
        prop = make_property(nearby_facilities=NearbyFacilities())
        assert score_transport_match(dna, prop) == NEUTRAL_SCORE


class TestInvestmentMatch:
    def test_matching_high_yield(self):
        dna = UserDNA(rental_yield_preference=RentalYieldPreference.HIGH)
        prop = make_property(rental_yield=8.0)
        assert score_investment_match(dna, prop) == 1.0

    def test_mismatched_band_partial_score(self):
        dna = UserDNA(rental_yield_preference=RentalYieldPreference.HIGH)
        prop = make_property(rental_yield=5.5)  # Medium band
        score = score_investment_match(dna, prop)
        assert 0.0 < score < 1.0

    def test_far_mismatched_band_scores_0(self):
        dna = UserDNA(rental_yield_preference=RentalYieldPreference.HIGH)
        prop = make_property(rental_yield=2.0)  # Low band
        assert score_investment_match(dna, prop) == 0.0

    def test_no_yield_preference_is_neutral(self):
        assert score_investment_match(UserDNA(), make_property()) == NEUTRAL_SCORE

    def test_unknown_property_yield_is_neutral(self):
        dna = UserDNA(rental_yield_preference=RentalYieldPreference.HIGH)
        prop = make_property(rental_yield=None)
        assert score_investment_match(dna, prop) == NEUTRAL_SCORE


class TestAllScoresNormalized:
    def test_every_scorer_returns_0_to_1_for_varied_inputs(self):
        dna = UserDNA(
            budget=Budget(min=500_000, max=1_000_000),
            locations=["Downtown Dubai"],
            property_types=["Villa"],
            bedrooms=5,
            purpose=Purpose.END_USE,
            amenities=["Sauna", "Tennis Court"],
            transport_preference=TransportPreference.NEAR_METRO,
            rental_yield_preference=RentalYieldPreference.HIGH,
        )
        prop = make_property(
            price=50_000_000,
            location="Dubai Marina",
            property_type="Studio",
            bedrooms=0,
            property_purpose=["Investment"],
            amenities=["Gym"],
            nearby_facilities=NearbyFacilities(metro_distance_km=20),
            rental_yield=1.0,
        )
        scores = score_all(dna, prop)
        assert set(scores.keys()) == set(ALL_SCORERS.keys())
        for name, value in scores.items():
            assert 0.0 <= value <= 1.0, f"{name} out of range: {value}"

    def test_score_all_covers_nine_match_types(self):
        assert len(ALL_SCORERS) == 9
