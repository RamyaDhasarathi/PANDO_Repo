/**
 * Buyer DNA Schema Definitions & Enums
 * Ported from Python pipelines/schemas/user_dna_schema.py and config/recommendation_weights.json
 */

export const Purpose = Object.freeze({
  INVESTMENT: 'Investment',
  END_USE: 'End use',
  RENTAL: 'Rental',
});

export const TransportPreference = Object.freeze({
  NEAR_METRO: 'Near Metro',
  NO_PREFERENCE: 'No Preference',
});

export const RentalYieldPreference = Object.freeze({
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  NO_PREFERENCE: 'No Preference',
});

/**
 * Default weights for Phase 2.3 cold-start recommendation feature matching.
 */
export const DEFAULT_WEIGHTS = Object.freeze({
  budget_match: 0.25,
  location_match: 0.20,
  property_type_match: 0.15,
  bedroom_match: 0.15,
  purpose_match: 0.10,
  amenity_match: 0.05,
  area_match: 0.00,
  transport_match: 0.05,
  investment_match: 0.05,
});

/**
 * Validates and constructs a UserDNA profile object.
 * Missing/unspecified preferences are set to null or empty arrays [].
 *
 * @param {Object} partial
 * @returns {Object} UserDNA
 */
export function createUserDNA(partial = {}) {
  const budget = partial.budget ? {
    min: typeof partial.budget.min === 'number' && partial.budget.min >= 0 ? partial.budget.min : null,
    max: typeof partial.budget.max === 'number' && partial.budget.max >= 0 ? partial.budget.max : null,
  } : null;

  // Ensure budget.min <= budget.max if both specified
  if (budget && budget.min !== null && budget.max !== null && budget.min > budget.max) {
    const temp = budget.min;
    budget.min = budget.max;
    budget.max = temp;
  }

  return {
    budget: budget && (budget.min !== null || budget.max !== null) ? budget : null,
    locations: Array.isArray(partial.locations) ? partial.locations.filter(Boolean) : [],
    property_types: Array.isArray(partial.property_types) ? partial.property_types.filter(Boolean) : [],
    bedrooms: typeof partial.bedrooms === 'number' && partial.bedrooms >= 0 ? Math.floor(partial.bedrooms) : null,
    purpose: Object.values(Purpose).includes(partial.purpose) ? partial.purpose : null,
    amenities: Array.isArray(partial.amenities) ? partial.amenities.filter(Boolean) : [],
    transport_preference: Object.values(TransportPreference).includes(partial.transport_preference)
      ? partial.transport_preference
      : null,
    rental_yield_preference: Object.values(RentalYieldPreference).includes(partial.rental_yield_preference)
      ? partial.rental_yield_preference
      : null,
  };
}
