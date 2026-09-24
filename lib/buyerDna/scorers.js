/**
 * Phase 2.3 Feature Matching Scorers.
 * Ported from Python pipelines/matching/scorers.py
 */

import { normalizeKey, getCanonicalLocationKey } from './extractor.js';
import { Purpose, RentalYieldPreference, TransportPreference } from './schema.js';

export const NEUTRAL_SCORE = 0.75;
const YIELD_HIGH_THRESHOLD = 7.0;
const YIELD_MEDIUM_THRESHOLD = 5.0;
const OVERAGE_TOLERANCE = 0.5;

function getPropertyPrice(property) {
  if (!property) return null;
  const listingPurpose = property.listing_purpose || property.listingPurpose || 'Sale';
  if (typeof listingPurpose === 'string' && listingPurpose.toLowerCase().includes('rent')) {
    return typeof property.rent_price === 'number' ? property.rent_price : property.rentPrice || property.price || null;
  }
  return typeof property.price === 'number' ? property.price : null;
}

export function scoreBudgetMatch(userDna, property) {
  if (!userDna || !userDna.budget || (userDna.budget.min === null && userDna.budget.max === null)) {
    return NEUTRAL_SCORE;
  }

  const price = getPropertyPrice(property);
  if (price === null || price === undefined) {
    return NEUTRAL_SCORE;
  }

  const low = userDna.budget.min;
  const high = userDna.budget.max;

  if (low !== null && price < low) {
    const deficitRatio = low > 0 ? (low - price) / low : 1.0;
    return Math.max(0.0, 1.0 - deficitRatio);
  }

  if (high !== null && price > high) {
    const overageRatio = high > 0 ? (price - high) / high : 1.0;
    return Math.max(0.0, 1.0 - overageRatio / OVERAGE_TOLERANCE);
  }

  return 1.0;
}

export function scoreLocationMatch(userDna, property) {
  if (!userDna || !Array.isArray(userDna.locations) || userDna.locations.length === 0) {
    return NEUTRAL_SCORE;
  }

  const wanted = new Set(userDna.locations.map(getCanonicalLocationKey).filter(Boolean));
  const propertyLoc = getCanonicalLocationKey(property ? property.location || property.community || '' : '');

  return wanted.has(propertyLoc) ? 1.0 : 0.0;
}

export function scorePropertyTypeMatch(userDna, property) {
  if (!userDna || !Array.isArray(userDna.property_types) || userDna.property_types.length === 0) {
    return NEUTRAL_SCORE;
  }

  const wanted = new Set(
    userDna.property_types.map((t) => {
      let k = normalizeKey(t);
      return k.endsWith('s') && k !== 'bus' ? k.replace(/s$/, '') : k;
    }).filter(Boolean)
  );

  let propertyType = normalizeKey(property ? property.property_type || property.propertyType || property.category || '' : '');
  if (propertyType.endsWith('s') && propertyType !== 'bus') {
    propertyType = propertyType.replace(/s$/, '');
  }

  return wanted.has(propertyType) ? 1.0 : 0.0;
}

export function scoreBedroomMatch(userDna, property) {
  if (!userDna || userDna.bedrooms === null || userDna.bedrooms === undefined) {
    return NEUTRAL_SCORE;
  }

  const propertyBedrooms = property && typeof property.bedrooms === 'number' ? property.bedrooms : 0;
  const diff = Math.abs(propertyBedrooms - userDna.bedrooms);

  if (diff === 0) return 1.0;
  return Math.max(0.0, 1.0 - 0.25 * diff);
}

const PURPOSE_TO_PROPERTY_PURPOSE = {
  [Purpose.INVESTMENT]: 'Investment',
  [Purpose.END_USE]: 'End use',
  [Purpose.RENTAL]: 'Rental',
};

export function scorePurposeMatch(userDna, property) {
  if (!userDna || !userDna.purpose) {
    return NEUTRAL_SCORE;
  }

  const wanted = PURPOSE_TO_PROPERTY_PURPOSE[userDna.purpose];
  let propertyPurposes = [];

  if (property) {
    if (Array.isArray(property.property_purpose)) {
      propertyPurposes = property.property_purpose.map((p) => (typeof p === 'object' ? p.value || p.label : p));
    } else if (Array.isArray(property.propertyPurpose)) {
      propertyPurposes = property.propertyPurpose;
    } else if (property.purchasingGoal || property.investmentInsight) {
      propertyPurposes = ['Investment', 'End use', 'Rental'];
    } else {
      const listingPurp = String(property.listing_purpose || property.listingPurpose || property.purpose || '').toLowerCase();
      if (listingPurp.includes('rent')) {
        propertyPurposes = ['Rental', 'Investment'];
      } else if (listingPurp.includes('sale') || listingPurp.includes('buy')) {
        propertyPurposes = ['Investment', 'End use'];
      } else {
        propertyPurposes = ['Investment', 'End use', 'Rental'];
      }
    }
  }

  return propertyPurposes.some((p) => String(p).toLowerCase() === String(wanted).toLowerCase()) ? 1.0 : 0.0;
}

export function scoreAmenityMatch(userDna, property) {
  if (!userDna || !Array.isArray(userDna.amenities) || userDna.amenities.length === 0) {
    return NEUTRAL_SCORE;
  }

  const wanted = new Set(userDna.amenities.map(normalizeKey).filter(Boolean));
  if (wanted.size === 0) return NEUTRAL_SCORE;

  const availableList = property && Array.isArray(property.amenities) ? property.amenities : [];
  const available = new Set(availableList.map(normalizeKey).filter(Boolean));

  let matchedCount = 0;
  for (const item of wanted) {
    if (available.has(item)) matchedCount++;
  }

  return matchedCount / wanted.size;
}

export function scoreAreaMatch(userDna, property) {
  return NEUTRAL_SCORE;
}

export function scoreTransportMatch(userDna, property) {
  if (
    !userDna ||
    !userDna.transport_preference ||
    userDna.transport_preference === TransportPreference.NO_PREFERENCE
  ) {
    return NEUTRAL_SCORE;
  }

  let metroDistance = null;
  if (property) {
    if (property.nearby_facilities && typeof property.nearby_facilities.metro_distance_km === 'number') {
      metroDistance = property.nearby_facilities.metro_distance_km;
    } else if (property.nearbyFacilities && typeof property.nearbyFacilities.metroDistanceKm === 'number') {
      metroDistance = property.nearbyFacilities.metroDistanceKm;
    } else if (typeof property.metroDistanceKm === 'number') {
      metroDistance = property.metroDistanceKm;
    }
  }

  if (metroDistance === null || metroDistance === undefined) {
    return NEUTRAL_SCORE;
  }

  if (metroDistance <= 1.0) return 1.0;
  if (metroDistance >= 5.0) return 0.0;
  return 1.0 - (metroDistance - 1.0) / 4.0;
}

function getYieldBand(yieldValue) {
  if (yieldValue >= YIELD_HIGH_THRESHOLD) return RentalYieldPreference.HIGH;
  if (yieldValue >= YIELD_MEDIUM_THRESHOLD) return RentalYieldPreference.MEDIUM;
  return RentalYieldPreference.LOW;
}

const YIELD_BAND_ORDER = [
  RentalYieldPreference.LOW,
  RentalYieldPreference.MEDIUM,
  RentalYieldPreference.HIGH,
];

export function scoreInvestmentMatch(userDna, property) {
  if (
    !userDna ||
    !userDna.rental_yield_preference ||
    userDna.rental_yield_preference === RentalYieldPreference.NO_PREFERENCE
  ) {
    return NEUTRAL_SCORE;
  }

  const yieldValue = property
    ? typeof property.rental_yield === 'number'
      ? property.rental_yield
      : typeof property.yield === 'number'
      ? property.yield
      : null
    : null;

  if (yieldValue === null || yieldValue === undefined) {
    return NEUTRAL_SCORE;
  }

  const wantedBand = userDna.rental_yield_preference;
  const actualBand = getYieldBand(yieldValue);

  if (wantedBand === actualBand) return 1.0;

  const wantedIdx = YIELD_BAND_ORDER.indexOf(wantedBand);
  const actualIdx = YIELD_BAND_ORDER.indexOf(actualBand);
  const bandDistance = Math.abs(wantedIdx - actualIdx);

  return Math.max(0.0, 1.0 - 0.5 * bandDistance);
}

export const ALL_SCORERS = {
  budget_match: scoreBudgetMatch,
  location_match: scoreLocationMatch,
  property_type_match: scorePropertyTypeMatch,
  bedroom_match: scoreBedroomMatch,
  purpose_match: scorePurposeMatch,
  amenity_match: scoreAmenityMatch,
  area_match: scoreAreaMatch,
  transport_match: scoreTransportMatch,
  investment_match: scoreInvestmentMatch,
};

export function scoreAll(userDna, property) {
  const result = {};
  for (const [name, scorer] of Object.entries(ALL_SCORERS)) {
    result[name] = scorer(userDna, property);
  }
  return result;
}
