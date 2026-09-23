import pytest
from pydantic import ValidationError

from pipelines.schemas.user_dna_schema import Budget, Purpose, TransportPreference, UserDNA


class TestBudgetValidation:
    def test_valid_range(self):
        b = Budget(min=1_000_000, max=1_800_000)
        assert b.min == 1_000_000
        assert b.max == 1_800_000

    def test_min_greater_than_max_rejected(self):
        with pytest.raises(ValidationError):
            Budget(min=2_000_000, max=1_000_000)

    def test_only_max_is_valid(self):
        b = Budget(max=1_500_000)
        assert b.min is None

    def test_only_min_is_valid(self):
        b = Budget(min=500_000)
        assert b.max is None

    def test_negative_values_rejected(self):
        with pytest.raises(ValidationError):
            Budget(min=-100)


class TestUserDNAValidation:
    def test_fully_specified(self):
        dna = UserDNA.model_validate(
            {
                "budget": {"min": 1_000_000, "max": 1_800_000},
                "locations": ["Dubai Marina", "Jumeirah Village Circle"],
                "property_types": ["Apartment"],
                "bedrooms": 2,
                "purpose": "Investment",
                "amenities": ["Gym", "Pool"],
                "transport_preference": "Near Metro",
                "rental_yield_preference": "High",
            }
        )
        assert dna.bedrooms == 2
        assert dna.purpose == Purpose.INVESTMENT
        assert dna.transport_preference == TransportPreference.NEAR_METRO
        assert dna.locations == ["Dubai Marina", "Jumeirah Village Circle"]

    def test_empty_user_dna_is_valid(self):
        """A brand new conversation with zero stated preferences must still validate —
        every field is optional so extraction can hand back a mostly-empty profile."""
        dna = UserDNA()
        assert dna.budget is None
        assert dna.locations == []
        assert dna.property_types == []
        assert dna.bedrooms is None
        assert dna.purpose is None
        assert dna.amenities == []
        assert dna.transport_preference is None
        assert dna.rental_yield_preference is None

    def test_partial_user_dna_is_valid(self):
        dna = UserDNA.model_validate({"bedrooms": 3, "locations": ["Downtown Dubai"]})
        assert dna.bedrooms == 3
        assert dna.locations == ["Downtown Dubai"]
        assert dna.budget is None

    def test_invalid_purpose_rejected(self):
        with pytest.raises(ValidationError):
            UserDNA.model_validate({"purpose": "Flipping"})

    def test_negative_bedrooms_rejected(self):
        with pytest.raises(ValidationError):
            UserDNA.model_validate({"bedrooms": -1})

    def test_invalid_nested_budget_rejected(self):
        with pytest.raises(ValidationError):
            UserDNA.model_validate({"budget": {"min": 2_000_000, "max": 1_000_000}})

    def test_round_trip_serialization(self):
        dna = UserDNA.model_validate(
            {"budget": {"min": 1_000_000, "max": 1_800_000}, "bedrooms": 2}
        )
        dumped = dna.model_dump(mode="json")
        restored = UserDNA.model_validate(dumped)
        assert restored == dna
