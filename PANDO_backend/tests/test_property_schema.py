import pytest
from pydantic import ValidationError

from pipelines.schemas.property_schema import ListingPurpose, Property

BASE_FIELDS = {
    "property_id": "P1",
    "property_name": "Test Property",
    "property_type": "Apartment",
    "location": "Dubai Marina",
    "bedrooms": 2,
    "bathrooms": 2,
    "built_up_area_sqft": 1000,
    "completion_status": "Ready",
}


class TestListingPurposePriceInvariant:
    def test_sale_listing_requires_price(self):
        with pytest.raises(ValidationError):
            Property.model_validate({**BASE_FIELDS, "listing_purpose": "Sale", "price": None})

    def test_sale_listing_with_price_is_valid(self):
        prop = Property.model_validate({**BASE_FIELDS, "listing_purpose": "Sale", "price": 1_000_000})
        assert prop.price == 1_000_000
        assert prop.rent_price is None

    def test_rent_listing_requires_rent_price(self):
        with pytest.raises(ValidationError):
            Property.model_validate({**BASE_FIELDS, "listing_purpose": "Rent", "rent_price": None})

    def test_rent_listing_with_rent_price_is_valid(self):
        prop = Property.model_validate(
            {**BASE_FIELDS, "listing_purpose": "Rent", "rent_price": 120_000}
        )
        assert prop.rent_price == 120_000
        assert prop.price is None

    def test_default_listing_purpose_is_sale(self):
        prop = Property.model_validate({**BASE_FIELDS, "price": 1_000_000})
        assert prop.listing_purpose == ListingPurpose.SALE

    def test_rent_price_not_conflated_with_price(self):
        """A rent listing's price must never leak into the sale `price` field."""
        prop = Property.model_validate(
            {**BASE_FIELDS, "listing_purpose": "Rent", "rent_price": 120_000, "price": None}
        )
        assert prop.price is None
        assert prop.rent_price == 120_000
