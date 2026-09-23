from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class PropertyPurpose(str, Enum):
    END_USE = "End use"
    INVESTMENT = "Investment"
    RENTAL = "Rental"


class FurnishingStatus(str, Enum):
    FURNISHED = "Furnished"
    SEMI_FURNISHED = "Semi-Furnished"
    UNFURNISHED = "Unfurnished"


class CompletionStatus(str, Enum):
    READY = "Ready"
    OFF_PLAN = "Off-Plan"
    UNDER_CONSTRUCTION = "Under Construction"


class ListingPurpose(str, Enum):
    SALE = "Sale"
    RENT = "Rent"


class NearbyFacilities(BaseModel):
    metro_distance_km: Optional[float] = Field(None, ge=0)
    schools_distance_km: Optional[float] = Field(None, ge=0)
    hospitals_distance_km: Optional[float] = Field(None, ge=0)
    shopping_distance_km: Optional[float] = Field(None, ge=0)
    beaches_distance_km: Optional[float] = Field(None, ge=0)
    business_districts_distance_km: Optional[float] = Field(None, ge=0)


class Property(BaseModel):
    property_id: str
    property_name: str
    developer: Optional[str] = None
    property_type: str
    location: str
    community: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    listing_purpose: ListingPurpose = ListingPurpose.SALE
    price: Optional[float] = Field(None, ge=0)
    rent_price: Optional[float] = Field(None, ge=0)
    bedrooms: int = Field(..., ge=0)
    bathrooms: int = Field(..., ge=0)
    built_up_area_sqft: float = Field(..., gt=0)
    furnishing_status: Optional[FurnishingStatus] = None
    completion_status: CompletionStatus
    handover_date: Optional[str] = None
    amenities: list[str] = Field(default_factory=list)
    parking: Optional[int] = Field(None, ge=0)
    view: Optional[str] = None
    floor: Optional[int] = None
    rental_estimate: Optional[float] = Field(None, ge=0)
    rental_yield: Optional[float] = Field(None, ge=0)
    service_charges: Optional[float] = Field(None, ge=0)
    property_purpose: list[PropertyPurpose] = Field(default_factory=list)
    nearby_facilities: NearbyFacilities = Field(default_factory=NearbyFacilities)

    @model_validator(mode="after")
    def _check_price_matches_listing_purpose(self) -> "Property":
        if self.listing_purpose == ListingPurpose.SALE and self.price is None:
            raise ValueError("price is required when listing_purpose is 'Sale'")
        if self.listing_purpose == ListingPurpose.RENT and self.rent_price is None:
            raise ValueError("rent_price is required when listing_purpose is 'Rent'")
        return self
