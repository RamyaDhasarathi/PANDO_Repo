from pipelines.training.interaction_features import (
    compute_amenity_similarity,
    compute_bedroom_difference,
    compute_budget_compatibility,
    compute_distance_preference,
    compute_historical_user_interest,
    compute_interaction_features,
    compute_investment_compatibility,
    compute_price_difference,
)


def user_dna(**overrides):
    base = {"bedrooms": None, "budget": None, "amenities": [], "rental_yield_preference": None}
    base.update(overrides)
    return base


def property_doc(**overrides):
    base = {
        "property_id": "P1",
        "location": "Dubai Marina",
        "property_type": "Apartment",
        "listing_purpose": "Sale",
        "price": 1_500_000,
        "rent_price": None,
        "bedrooms": 2,
        "amenities": [],
        "rental_yield": None,
        "nearby_facilities": {},
    }
    base.update(overrides)
    return base


class TestPriceDifference:
    def test_within_budget_is_zero(self):
        dna = user_dna(budget={"min": 1_000_000, "max": 2_000_000})
        assert compute_price_difference(dna, property_doc(price=1_500_000)) == 0.0

    def test_over_budget_is_positive_delta(self):
        dna = user_dna(budget={"max": 1_000_000})
        assert compute_price_difference(dna, property_doc(price=1_300_000)) == 300_000

    def test_under_min_budget_is_negative_delta(self):
        dna = user_dna(budget={"min": 1_000_000})
        assert compute_price_difference(dna, property_doc(price=800_000)) == -200_000

    def test_no_budget_stated_is_none(self):
        assert compute_price_difference(user_dna(), property_doc()) is None

    def test_uses_rent_price_for_rent_listings(self):
        dna = user_dna(budget={"max": 100_000})
        prop = property_doc(listing_purpose="Rent", price=None, rent_price=120_000)
        assert compute_price_difference(dna, prop) == 20_000


class TestBudgetCompatibility:
    def test_at_budget_max_is_one(self):
        dna = user_dna(budget={"max": 1_000_000})
        assert compute_budget_compatibility(dna, property_doc(price=1_000_000)) == 1.0

    def test_over_budget_is_greater_than_one(self):
        dna = user_dna(budget={"max": 1_000_000})
        assert compute_budget_compatibility(dna, property_doc(price=2_000_000)) == 2.0

    def test_no_budget_max_is_none(self):
        assert compute_budget_compatibility(user_dna(), property_doc()) is None


class TestBedroomDifference:
    def test_signed_difference(self):
        dna = user_dna(bedrooms=2)
        assert compute_bedroom_difference(dna, property_doc(bedrooms=3)) == 1
        assert compute_bedroom_difference(dna, property_doc(bedrooms=1)) == -1

    def test_missing_data_is_none(self):
        assert compute_bedroom_difference(user_dna(), property_doc(bedrooms=2)) is None


class TestAmenitySimilarity:
    def test_full_overlap_is_one(self):
        dna = user_dna(amenities=["Gym", "Pool"])
        assert compute_amenity_similarity(dna, property_doc(amenities=["Gym", "Pool"])) == 1.0

    def test_partial_overlap_jaccard(self):
        dna = user_dna(amenities=["Gym", "Pool"])
        prop = property_doc(amenities=["Gym", "Garden"])
        # intersection={Gym}=1, union={Gym,Pool,Garden}=3
        assert compute_amenity_similarity(dna, prop) == 1 / 3

    def test_no_amenities_either_side_is_none(self):
        assert compute_amenity_similarity(user_dna(), property_doc(amenities=[])) is None


class TestDistancePreference:
    def test_returns_raw_metro_distance(self):
        prop = property_doc(nearby_facilities={"metro_distance_km": 2.5})
        assert compute_distance_preference(prop) == 2.5

    def test_unknown_distance_is_none(self):
        assert compute_distance_preference(property_doc(nearby_facilities={})) is None


class TestInvestmentCompatibility:
    def test_high_preference_threshold(self):
        dna = user_dna(rental_yield_preference="High")
        assert compute_investment_compatibility(dna, property_doc(rental_yield=8.0)) == 1.0
        assert compute_investment_compatibility(dna, property_doc(rental_yield=6.0)) == -1.0

    def test_no_preference_is_none(self):
        assert compute_investment_compatibility(user_dna(), property_doc(rental_yield=8.0)) is None

    def test_no_property_yield_is_none(self):
        dna = user_dna(rental_yield_preference="High")
        assert compute_investment_compatibility(dna, property_doc(rental_yield=None)) is None


class TestHistoricalUserInterest:
    def test_no_history_is_zero(self):
        assert compute_historical_user_interest("u1", property_doc(), []) == 0.0

    def test_positive_interaction_with_same_property_is_one(self):
        history = [{"propertyId": "P1", "label": "Positive"}]
        assert compute_historical_user_interest("u1", property_doc(property_id="P1"), history) == 1.0

    def test_negative_interaction_with_same_property_is_not_one(self):
        history = [{"propertyId": "P1", "label": "Negative"}]
        assert compute_historical_user_interest("u1", property_doc(property_id="P1"), history) == 0.0

    def test_positive_interaction_with_same_location_is_half(self):
        history = [{"propertyId": "OTHER", "label": "Positive", "location": "Dubai Marina", "property_type": "Villa"}]
        result = compute_historical_user_interest(
            "u1", property_doc(property_id="P1", location="Dubai Marina"), history
        )
        assert result == 0.5

    def test_no_related_history_is_zero(self):
        history = [{"propertyId": "OTHER", "label": "Positive", "location": "Downtown Dubai", "property_type": "Villa"}]
        result = compute_historical_user_interest(
            "u1", property_doc(property_id="P1", location="Dubai Marina", property_type="Apartment"), history
        )
        assert result == 0.0


class TestComputeInteractionFeatures:
    def test_returns_all_nine_features(self):
        dna = user_dna(bedrooms=2, budget={"max": 1_000_000}, amenities=["Gym"])
        prop = property_doc(bedrooms=2, amenities=["Gym"])
        match_scores = {"location_match": 1.0, "property_type_match": 1.0}
        result = compute_interaction_features("u1", dna, prop, match_scores, [])

        expected_keys = {
            "price_difference", "budget_compatibility", "location_similarity",
            "property_type_match", "bedroom_difference", "amenity_similarity",
            "historical_user_interest", "distance_preference", "investment_compatibility",
        }
        assert set(result.keys()) == expected_keys
        assert result["location_similarity"] == 1.0
        assert result["property_type_match"] == 1.0
