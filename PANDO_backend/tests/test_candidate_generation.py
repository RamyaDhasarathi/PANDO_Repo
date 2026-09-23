import pytest

from pipelines.matching.candidate_generation import (
    generate_recommendations,
    pre_filter_candidates,
    score_and_rank,
)
from pipelines.matching.scorers import ALL_SCORERS
from pipelines.schemas.property_schema import Property
from pipelines.schemas.user_dna_schema import Budget, Purpose, UserDNA


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


class TestPreFilterCandidates:
    def test_filters_out_far_over_budget(self):
        dna = UserDNA(budget=Budget(max=1_000_000))
        properties = [
            make_property(property_id="cheap", price=900_000),
            make_property(property_id="expensive", price=10_000_000),
        ]
        result = pre_filter_candidates(dna, properties)
        ids = [p.property_id for p in result]
        assert "cheap" in ids
        assert "expensive" not in ids

    def test_keeps_slightly_over_budget_within_tolerance(self):
        dna = UserDNA(budget=Budget(max=1_000_000))
        properties = [make_property(property_id="slightly_over", price=1_300_000)]
        result = pre_filter_candidates(dna, properties)
        assert len(result) == 1

    def test_filters_by_location(self):
        dna = UserDNA(locations=["Downtown Dubai"])
        properties = [
            make_property(property_id="marina", location="Dubai Marina"),
            make_property(property_id="downtown", location="Downtown Dubai"),
        ]
        result = pre_filter_candidates(dna, properties)
        ids = [p.property_id for p in result]
        assert ids == ["downtown"]

    def test_no_filters_when_no_preferences_stated(self):
        dna = UserDNA()
        properties = [make_property(property_id=str(i)) for i in range(5)]
        result = pre_filter_candidates(dna, properties)
        assert len(result) == 5

    def test_missing_price_not_excluded_by_budget_filter(self):
        dna = UserDNA(budget=Budget(max=1_000_000))
        prop = make_property(property_id="rent_only", listing_purpose="Rent", price=None, rent_price=90_000)
        result = pre_filter_candidates(dna, [prop])
        assert len(result) == 1


class TestHardRuleBasedFilters:
    """Rule-based hard exclusions (to be replaced with an LLM-based judgment later, per user
    decision): a fundamental purpose or property-category mismatch disqualifies a candidate
    outright rather than just costing it points on one of 9 weighted scorers."""

    def test_buyer_excludes_rent_only_listings(self):
        dna = UserDNA(purpose=Purpose.END_USE)
        properties = [
            make_property(property_id="for_sale", listing_purpose="Sale", price=1_000_000),
            make_property(property_id="rent_only", listing_purpose="Rent", price=None, rent_price=90_000),
        ]
        result = pre_filter_candidates(dna, properties)
        ids = [p.property_id for p in result]
        assert ids == ["for_sale"]

    def test_investment_purpose_also_excludes_rent_only(self):
        dna = UserDNA(purpose=Purpose.INVESTMENT)
        prop = make_property(listing_purpose="Rent", price=None, rent_price=90_000)
        assert pre_filter_candidates(dna, [prop]) == []

    def test_renter_excludes_sale_only_listings(self):
        dna = UserDNA(purpose=Purpose.RENTAL)
        properties = [
            make_property(property_id="for_sale", listing_purpose="Sale", price=1_000_000),
            make_property(property_id="rent_only", listing_purpose="Rent", price=None, rent_price=90_000),
        ]
        result = pre_filter_candidates(dna, properties)
        ids = [p.property_id for p in result]
        assert ids == ["rent_only"]

    def test_no_purpose_stated_excludes_nothing_on_purpose(self):
        dna = UserDNA()
        properties = [
            make_property(property_id="for_sale", listing_purpose="Sale", price=1_000_000),
            make_property(property_id="rent_only", listing_purpose="Rent", price=None, rent_price=90_000),
        ]
        result = pre_filter_candidates(dna, properties)
        assert len(result) == 2

    def test_residential_request_excludes_commercial_property(self):
        dna = UserDNA(property_types=["Apartment"])
        properties = [
            make_property(property_id="apt", property_type="Apartment"),
            make_property(property_id="shop", property_type="Retail"),
        ]
        result = pre_filter_candidates(dna, properties)
        ids = [p.property_id for p in result]
        assert ids == ["apt"]

    def test_commercial_request_excludes_residential_property(self):
        dna = UserDNA(property_types=["Office"])
        properties = [
            make_property(property_id="office", property_type="Office"),
            make_property(property_id="villa", property_type="Villa"),
        ]
        result = pre_filter_candidates(dna, properties)
        ids = [p.property_id for p in result]
        assert ids == ["office"]

    def test_no_property_type_stated_excludes_nothing_on_category(self):
        dna = UserDNA()
        properties = [
            make_property(property_id="apt", property_type="Apartment"),
            make_property(property_id="shop", property_type="Retail"),
        ]
        result = pre_filter_candidates(dna, properties)
        assert len(result) == 2

    def test_land_never_excluded_on_category(self):
        """Land has no residential/commercial category — never hard-excluded on this basis."""
        dna = UserDNA(property_types=["Apartment"])
        prop = make_property(property_type="Land")
        assert pre_filter_candidates(dna, [prop]) == [prop]

    def test_mixed_category_request_excludes_nothing_on_category(self):
        """If the user asks for both a residential and a commercial type, neither category
        should be hard-excluded — the request itself spans both."""
        dna = UserDNA(property_types=["Apartment", "Office"])
        properties = [
            make_property(property_id="apt", property_type="Apartment"),
            make_property(property_id="office", property_type="Office"),
            make_property(property_id="villa", property_type="Villa"),
        ]
        result = pre_filter_candidates(dna, properties)
        ids = {p.property_id for p in result}
        assert ids == {"apt", "office", "villa"}

    def test_retail_shop_no_longer_surfaces_for_residential_seeker(self):
        """Regression test for the Phase 2 checkpoint finding: a Retail Shop must not appear
        in results for a user explicitly wanting a residential Studio."""
        dna = UserDNA(property_types=["Studio"], purpose=Purpose.RENTAL)
        properties = [
            make_property(property_id="studio", property_type="Studio", listing_purpose="Rent", price=None, rent_price=60_000),
            make_property(property_id="shop", property_type="Retail", listing_purpose="Rent", price=None, rent_price=60_000),
        ]
        result = pre_filter_candidates(dna, properties)
        ids = [p.property_id for p in result]
        assert ids == ["studio"]


class TestScoreAndRank:
    UNIFORM_WEIGHTS = {name: 1 / 9 for name in ALL_SCORERS}

    def test_higher_scoring_property_ranks_first(self):
        dna = UserDNA(locations=["Dubai Marina"], bedrooms=2)
        good = make_property(property_id="good", location="Dubai Marina", bedrooms=2)
        bad = make_property(property_id="bad", location="Downtown Dubai", bedrooms=5)
        ranked = score_and_rank(dna, [bad, good], weights=self.UNIFORM_WEIGHTS)
        assert ranked[0].property.property_id == "good"
        assert ranked[0].score > ranked[1].score

    def test_ranked_list_is_sorted_descending(self):
        dna = UserDNA(bedrooms=2)
        properties = [make_property(property_id=str(i), bedrooms=i) for i in range(6)]
        ranked = score_and_rank(dna, properties, weights=self.UNIFORM_WEIGHTS)
        scores = [r.score for r in ranked]
        assert scores == sorted(scores, reverse=True)

    def test_match_scores_included_per_result(self):
        dna = UserDNA(bedrooms=2)
        ranked = score_and_rank(dna, [make_property()], weights=self.UNIFORM_WEIGHTS)
        assert set(ranked[0].match_scores.keys()) == set(ALL_SCORERS.keys())


class TestGenerateRecommendationsFunnel:
    UNIFORM_WEIGHTS = {name: 1 / 9 for name in ALL_SCORERS}

    def test_full_funnel_returns_top_n(self):
        dna = UserDNA(locations=["Dubai Marina"], budget=Budget(max=2_000_000))
        properties = [
            make_property(property_id=str(i), location="Dubai Marina", price=1_000_000 + i * 10_000)
            for i in range(20)
        ] + [make_property(property_id="excluded", location="Downtown Dubai")]

        result = generate_recommendations(dna, properties, top_n=5, weights=self.UNIFORM_WEIGHTS)
        assert len(result) == 5
        assert all(r.property.location == "Dubai Marina" for r in result)

    def test_top_n_larger_than_candidate_pool(self):
        dna = UserDNA()
        properties = [make_property(property_id=str(i)) for i in range(3)]
        result = generate_recommendations(dna, properties, top_n=10, weights=self.UNIFORM_WEIGHTS)
        assert len(result) == 3


@pytest.mark.integration
class TestFullFunnelAgainstPhase1Dataset:
    """Exercises the funnel against the real Phase 1 dataset in MongoDB, confirming sensible
    narrowing at each stage (per the Phase 2.5 checklist requirement)."""

    def test_funnel_narrows_sensibly_on_real_dataset(self):
        from pipelines.matching.candidate_generation import pre_filter_candidates, score_and_rank
        from pipelines.matching.repository import load_all_properties

        all_properties = load_all_properties()
        assert len(all_properties) > 100  # sanity check we're hitting the real dataset

        dna = UserDNA(
            budget=Budget(min=1_000_000, max=2_000_000),
            locations=["Jumeirah Village Circle", "Dubai Marina"],
            property_types=["Apartment", "Townhouse"],
            bedrooms=2,
        )

        candidates = pre_filter_candidates(dna, all_properties)
        assert 0 < len(candidates) < len(all_properties)

        ranked = score_and_rank(dna, candidates)
        assert len(ranked) == len(candidates)
        scores = [r.score for r in ranked]
        assert scores == sorted(scores, reverse=True)

        top_10 = ranked[:10]
        assert len(top_10) <= 10
        for r in top_10:
            assert 0.0 <= r.score <= 1.0

    def test_residential_only_excludes_commercial_from_live_dataset(self):
        from pipelines.matching.property_category import is_residential
        from pipelines.matching.repository import load_all_properties

        residential_properties = load_all_properties(residential_only=True)
        all_properties = load_all_properties(residential_only=False)

        assert len(all_properties) > len(residential_properties)
        assert all(is_residential(p.property_type) for p in residential_properties)

        # regression check for the specific record found during the Phase 2 checkpoint review
        excluded_ids = {p.property_id for p in all_properties} - {
            p.property_id for p in residential_properties
        }
        assert "LST-hp-1010" in excluded_ids  # the "Retail Shop" stored as property_type="Commercial"
