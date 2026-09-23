from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class Purpose(str, Enum):
    INVESTMENT = "Investment"
    END_USE = "End use"
    RENTAL = "Rental"


class TransportPreference(str, Enum):
    NEAR_METRO = "Near Metro"
    NO_PREFERENCE = "No Preference"


class RentalYieldPreference(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    NO_PREFERENCE = "No Preference"


class Budget(BaseModel):
    min: Optional[float] = Field(None, ge=0)
    max: Optional[float] = Field(None, ge=0)

    @model_validator(mode="after")
    def _check_min_le_max(self) -> "Budget":
        if self.min is not None and self.max is not None and self.min > self.max:
            raise ValueError("budget.min must not be greater than budget.max")
        return self


class UserDNA(BaseModel):
    """
    Structured user preference profile used for cold-start (Phase 2) content-based matching.

    Every field is optional: a real conversation rarely states every preference up front, and
    the Phase 2.2 extraction pipeline must be able to produce a partial UserDNA from whatever
    the user actually said, leaving the rest for feature matching to treat as "no preference"
    (see pipelines/matching — a None/empty field yields a neutral score, not a penalty).
    """

    budget: Optional[Budget] = None
    locations: list[str] = Field(default_factory=list)
    property_types: list[str] = Field(default_factory=list)
    bedrooms: Optional[int] = Field(None, ge=0)
    purpose: Optional[Purpose] = None
    amenities: list[str] = Field(default_factory=list)
    transport_preference: Optional[TransportPreference] = None
    rental_yield_preference: Optional[RentalYieldPreference] = None
