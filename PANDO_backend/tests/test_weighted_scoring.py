import json

import pytest

from pipelines.matching.scorers import ALL_SCORERS, NEUTRAL_SCORE
from pipelines.matching.weighted_scoring import compute_recommendation_score, load_weights
from pipelines.schemas.property_schema import Property
from pipelines.schemas.user_dna_schema import Budget, UserDNA


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


class TestLoadWeights:
    def test_default_config_loads_and_sums_to_one(self):
        weights = load_weights()
        assert set(weights.keys()) == set(ALL_SCORERS.keys())
        assert sum(weights.values()) == pytest.approx(1.0)

    def test_missing_match_type_rejected(self, tmp_path):
        bad = {k: 1 / 8 for k in list(ALL_SCORERS.keys())[:8]}  # only 8 of 9
        path = tmp_path / "bad_weights.json"
        path.write_text(json.dumps(bad))
        with pytest.raises(ValueError, match="missing match types"):
            load_weights(path)

    def test_unknown_match_type_rejected(self, tmp_path):
        bad = {k: 1 / 10 for k in ALL_SCORERS}
        bad["made_up_match"] = 1 / 10
        path = tmp_path / "bad_weights.json"
        path.write_text(json.dumps(bad))
        with pytest.raises(ValueError, match="unknown match types"):
            load_weights(path)

    def test_weights_not_summing_to_one_rejected(self, tmp_path):
        bad = {k: 0.05 for k in ALL_SCORERS}  # sums to 0.45
        path = tmp_path / "bad_weights.json"
        path.write_text(json.dumps(bad))
        with pytest.raises(ValueError, match="must sum to 1.0"):
            load_weights(path)


class TestComputeRecommendationScore:
    UNIFORM_WEIGHTS = {name: 1 / 9 for name in ALL_SCORERS}

    def test_perfect_match_scores_near_1(self):
        dna = UserDNA(
            budget=Budget(min=1_000_000, max=2_000_000),
            locations=["Dubai Marina"],
            property_types=["Apartment"],
            bedrooms=2,
            amenities=["Gym", "Pool"],
        )
        prop = make_property()
        total, components = compute_recommendation_score(dna, prop, self.UNIFORM_WEIGHTS)
        # 5 stated preferences match perfectly (1.0 each); the 4 unstated ones (purpose, area,
        # transport, investment) fall back to NEUTRAL_SCORE — so the average is pulled down
        # from 1.0, not a defect. (5*1.0 + 4*0.75) / 9 = 0.8889.
        assert total == pytest.approx((5 * 1.0 + 4 * NEUTRAL_SCORE) / 9)
        assert components["budget_match"] == 1.0
        assert components["location_match"] == 1.0

    def test_all_neutral_when_no_preferences_stated(self):
        dna = UserDNA()
        prop = make_property()
        total, components = compute_recommendation_score(dna, prop, self.UNIFORM_WEIGHTS)
        assert total == pytest.approx(NEUTRAL_SCORE)
        assert all(v == NEUTRAL_SCORE for v in components.values())

    def test_known_weighted_combination(self):
        """Two match types set to known values, rest neutral — verify the weighted sum math."""
        dna = UserDNA(locations=["Downtown Dubai"], property_types=["Villa"])
        prop = make_property(location="Dubai Marina", property_type="Apartment")

        weights = {name: 0.0 for name in ALL_SCORERS}
        weights["location_match"] = 0.6
        weights["property_type_match"] = 0.4

        total, components = compute_recommendation_score(dna, prop, weights)
        assert components["location_match"] == 0.0
        assert components["property_type_match"] == 0.0
        assert total == pytest.approx(0.0)

    def test_weighted_sum_matches_manual_calculation(self):
        dna = UserDNA(bedrooms=2)
        prop = make_property(bedrooms=2)

        weights = {name: 0.0 for name in ALL_SCORERS}
        weights["bedroom_match"] = 1.0

        total, components = compute_recommendation_score(dna, prop, weights)
        assert total == components["bedroom_match"] == 1.0

    def test_default_config_produces_bounded_score(self):
        weights = load_weights()
        dna = UserDNA(budget=Budget(max=1_000_000), bedrooms=5)
        prop = make_property(price=50_000_000, bedrooms=0)
        total, _ = compute_recommendation_score(dna, prop, weights)
        assert 0.0 <= total <= 1.0
