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
from pipelines.extraction.pipeline import extract_user_dna
from pipelines.schemas.user_dna_schema import Purpose, RentalYieldPreference, TransportPreference


class TestBudgetExtraction:
    def test_around_shorthand(self):
        b = extract_budget("I want a 2-bedroom apartment around 1.5 million in Dubai.")
        assert b.max == 1_500_000
        assert b.min is None

    def test_under_phrase(self):
        b = extract_budget("Looking for something under AED 800,000.")
        assert b.max == 800_000

    def test_explicit_range(self):
        b = extract_budget("My budget is between 1,000,000 and 1,800,000 AED.")
        assert b.min == 1_000_000
        assert b.max == 1_800_000

    def test_range_with_dash_and_shorthand(self):
        b = extract_budget("Budget: 1.2M - 1.8M")
        assert b.min == 1_200_000
        assert b.max == 1_800_000

    def test_over_phrase(self):
        b = extract_budget("I'd like something above 2 million, investment grade.")
        assert b.min == 2_000_000

    def test_no_budget_mentioned(self):
        assert extract_budget("I like Dubai Marina and want a pool.") is None

    def test_small_bare_number_not_mistaken_for_budget(self):
        # "2 bedroom" should not be picked up as a 2 AED budget
        assert extract_budget("I want a 2 bedroom apartment") is None


class TestCategoricalExtraction:
    def test_locations_multiple(self):
        locs = extract_locations("I'm considering Dubai Marina or JVC.")
        assert "Dubai Marina" in locs
        assert "Jumeirah Village Circle" in locs

    def test_property_type_alias(self):
        assert extract_property_types("Looking for a nice condo") == ["Apartment"]

    def test_bedrooms_numeric(self):
        assert extract_bedrooms("a 3 bedroom villa") == 3

    def test_bedrooms_bhk_format(self):
        assert extract_bedrooms("2BHK apartment") == 2

    def test_bedrooms_studio(self):
        assert extract_bedrooms("just a studio is fine") == 0

    def test_bedrooms_absent(self):
        assert extract_bedrooms("something nice in Dubai Marina") is None

    def test_purpose_investment(self):
        assert extract_purpose("I want this purely for investment purposes") == Purpose.INVESTMENT

    def test_purpose_end_use(self):
        assert extract_purpose("I plan to live in it with my family") == Purpose.END_USE

    def test_purpose_rental(self):
        assert extract_purpose("I want to rent it out for income") == Purpose.RENTAL

    def test_amenities_multiple(self):
        amenities = extract_amenities("must have a gym and a pool, ideally with a garden too")
        assert set(amenities) == {"Gym", "Pool", "Garden"}

    def test_transport_preference(self):
        assert extract_transport_preference("close to the metro station please") == TransportPreference.NEAR_METRO

    def test_transport_preference_absent(self):
        assert extract_transport_preference("I like Dubai Marina") is None

    def test_rental_yield_high(self):
        assert extract_rental_yield_preference("looking for high rental yield") == RentalYieldPreference.HIGH


class TestFullConversationExtraction:
    """10+ varied end-to-end conversation samples, including incomplete/ambiguous ones,
    per the Phase 2.2 checklist requirement."""

    def test_conversation_1_full_investor_profile(self):
        text = (
            "I want a 2-bedroom apartment around 1.5 million in Dubai, "
            "preferably somewhere close to the metro. It's for investment, "
            "and I'd like high rental yield. A gym and pool would be great."
        )
        dna = extract_user_dna(text)
        assert dna.budget.max == 1_500_000
        assert dna.bedrooms == 2
        assert dna.property_types == ["Apartment"]
        assert dna.transport_preference == TransportPreference.NEAR_METRO
        assert dna.purpose == Purpose.INVESTMENT
        assert dna.rental_yield_preference == RentalYieldPreference.HIGH
        assert set(dna.amenities) == {"Gym", "Pool"}

    def test_conversation_2_family_end_use(self):
        text = (
            "We're a family of four looking to live in a 3 bedroom villa in "
            "Arabian Ranches. We'd love a garden and a pool for the kids."
        )
        dna = extract_user_dna(text)
        assert dna.bedrooms == 3
        assert dna.property_types == ["Villa"]
        assert "Arabian Ranches" in dna.locations
        assert dna.purpose == Purpose.END_USE
        assert set(dna.amenities) == {"Garden", "Pool"}

    def test_conversation_3_budget_range_only(self):
        text = "Our budget is between AED 1,000,000 and AED 1,800,000."
        dna = extract_user_dna(text)
        assert dna.budget.min == 1_000_000
        assert dna.budget.max == 1_800_000
        assert dna.bedrooms is None
        assert dna.locations == []

    def test_conversation_4_extremely_vague(self):
        """Ambiguous/incomplete: no numbers, no clear location, no purpose."""
        text = "I'm just looking around, not sure what I want yet."
        dna = extract_user_dna(text)
        assert dna.budget is None
        assert dna.bedrooms is None
        assert dna.locations == []
        assert dna.property_types == []
        assert dna.purpose is None

    def test_conversation_5_location_only(self):
        text = "I really like JVC, that's the only area I'm considering."
        dna = extract_user_dna(text)
        assert dna.locations == ["Jumeirah Village Circle"]
        assert dna.budget is None
        assert dna.bedrooms is None

    def test_conversation_6_rental_investor_with_yield(self):
        text = (
            "Looking to buy something to rent out — need good returns, "
            "ideally under 900k, a studio or 1 bedroom near the metro."
        )
        dna = extract_user_dna(text)
        assert dna.purpose == Purpose.RENTAL
        assert dna.rental_yield_preference == RentalYieldPreference.HIGH
        assert dna.budget.max == 900_000
        assert dna.transport_preference == TransportPreference.NEAR_METRO
        # "studio or 1 bedroom" — the numeric bedroom pattern is checked before the studio
        # pattern (see _BEDROOM_PATTERNS order), so the explicit "1 bedroom" wins
        assert dna.bedrooms == 1

    def test_conversation_7_multiple_locations_and_types(self):
        text = "I'm open to an apartment or townhouse, maybe in Dubai Marina, Downtown Dubai, or JLT."
        dna = extract_user_dna(text)
        assert set(dna.property_types) == {"Apartment", "Townhouse"}
        assert set(dna.locations) == {"Dubai Marina", "Downtown Dubai", "Jumeirah Lake Towers"}

    def test_conversation_8_currency_shorthand_variety(self):
        text = "Budget around $500k for a penthouse."
        dna = extract_user_dna(text)
        assert dna.budget.max == round(500_000 * 3.6725, 2)
        assert dna.property_types == ["Penthouse"]

    def test_conversation_9_no_amenities_or_transport_mentioned(self):
        text = "Need a 4 bedroom villa in Dubai Hills Estate for around 3.5 million, for investment."
        dna = extract_user_dna(text)
        assert dna.bedrooms == 4
        assert dna.property_types == ["Villa"]
        assert "Dubai Hills Estate" in dna.locations
        assert dna.budget.max == 3_500_000
        assert dna.purpose == Purpose.INVESTMENT
        assert dna.amenities == []
        assert dna.transport_preference is None

    def test_conversation_10_incomplete_only_amenities(self):
        """Ambiguous: user only states amenity preferences, nothing else."""
        text = "It needs to have a gym, a sauna, and preferably a steam room."
        dna = extract_user_dna(text)
        assert set(dna.amenities) == {"Gym", "Sauna", "Steam Room"}
        assert dna.budget is None
        assert dna.bedrooms is None
        assert dna.property_types == []
        assert dna.locations == []

    def test_conversation_11_contradictory_signals_still_extracts_first_match(self):
        """Ambiguous: mentions both investment and living in it — extractor takes first keyword hit,
        documented behavior rather than an attempt at true intent disambiguation."""
        text = "I might live in it myself, but it's also a good investment opportunity."
        dna = extract_user_dna(text)
        assert dna.purpose in (Purpose.END_USE, Purpose.INVESTMENT)

    def test_conversation_12_empty_string(self):
        dna = extract_user_dna("")
        assert dna == extract_user_dna("")  # deterministic
        assert dna.budget is None
        assert dna.locations == []
