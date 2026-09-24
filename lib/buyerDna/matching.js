/**
 * Candidate Generation, Weighted Scoring & Rationale Explanation Engine.
 * Ported from Python pipelines/matching/ candidate_generation.py, weighted_scoring.py, explanation.py, property_category.py
 */

import { normalizeKey, getCanonicalLocationKey } from './extractor.js';
import { scoreAll, NEUTRAL_SCORE } from './scorers.js';
import { DEFAULT_WEIGHTS, Purpose } from './schema.js';

const PRE_FILTER_BUDGET_TOLERANCE = 0.5;
const STRONG_MATCH_THRESHOLD = 0.8;

const RESIDENTIAL_TYPES = new Set(['apartment', 'townhouse', 'villa', 'penthouse', 'duplex', 'studio']);
const COMMERCIAL_TYPES = new Set(['office', 'retail', 'warehouse', 'commercial']);

export function propertyCategory(propertyType) {
  if (!propertyType) return null;
  let key = normalizeKey(propertyType);
  if (key.endsWith('s') && key !== 'bus') key = key.replace(/s$/, '');
  if (RESIDENTIAL_TYPES.has(key)) return 'residential';
  if (COMMERCIAL_TYPES.has(key)) return 'commercial';
  return null;
}

export function isResidential(propertyType) {
  return propertyCategory(propertyType) === 'residential';
}

function getPropertyPrice(property) {
  if (!property) return null;
  const listingPurpose = property.listing_purpose || property.listingPurpose || 'Sale';
  if (typeof listingPurpose === 'string' && listingPurpose.toLowerCase().includes('rent')) {
    return typeof property.rent_price === 'number' ? property.rent_price : property.rentPrice || property.price || null;
  }
  return typeof property.price === 'number' ? property.price : null;
}

function propertyPurposeConflicts(userDna, property) {
  if (!userDna || !userDna.purpose) return false;
  const listingPurpose = property
    ? String(property.listing_purpose || property.listingPurpose || property.purpose || 'Sale')
    : 'Sale';

  const wantsToBuy = userDna.purpose === Purpose.INVESTMENT || userDna.purpose === Purpose.END_USE;
  const wantsToRent = userDna.purpose === Purpose.RENTAL;

  const isRentListing = listingPurpose.toLowerCase().includes('rent');
  const isSaleListing = listingPurpose.toLowerCase().includes('sale');

  if (wantsToBuy && isRentListing) return true;
  if (wantsToRent && isSaleListing) return true;

  return false;
}

function propertyTypeConflicts(userDna, property) {
  if (!userDna || !Array.isArray(userDna.property_types) || userDna.property_types.length === 0) {
    return false;
  }

  const propCategory = propertyCategory(property ? property.property_type || property.propertyType || property.category || '' : '');
  if (!propCategory) return false;

  const wantedCategories = new Set(
    userDna.property_types.map(propertyCategory).filter(Boolean)
  );

  if (wantedCategories.size === 0) return false;
  return !wantedCategories.has(propCategory);
}

export function preFilterCandidates(userDna, properties = []) {
  if (!Array.isArray(properties)) return [];

  let candidates = properties.filter((p) => {
    return !propertyPurposeConflicts(userDna, p) && !propertyTypeConflicts(userDna, p);
  });

  if (userDna && userDna.budget && (userDna.budget.min !== null || userDna.budget.max !== null)) {
    const low = userDna.budget.min;
    const high = userDna.budget.max;

    candidates = candidates.filter((p) => {
      const price = getPropertyPrice(p);
      if (price === null || price === undefined) return true;
      if (low !== null && price < low * (1 - PRE_FILTER_BUDGET_TOLERANCE)) return false;
      if (high !== null && price > high * (1 + PRE_FILTER_BUDGET_TOLERANCE)) return false;
      return true;
    });
  }

  if (userDna && Array.isArray(userDna.locations) && userDna.locations.length > 0) {
    const wanted = new Set(userDna.locations.map(getCanonicalLocationKey).filter(Boolean));
    candidates = candidates.filter((p) => {
      const pLoc = getCanonicalLocationKey(p ? p.location || p.community || '' : '');
      return wanted.has(pLoc);
    });
  }

  return candidates;
}

export function computeRecommendationScore(userDna, property, weights = DEFAULT_WEIGHTS) {
  const matchScores = scoreAll(userDna, property);
  let total = 0;
  for (const [name, weight] of Object.entries(weights)) {
    total += (matchScores[name] ?? NEUTRAL_SCORE) * weight;
  }
  return { total, matchScores };
}

export function scoreAndRank(userDna, candidates = [], weights = DEFAULT_WEIGHTS) {
  const ranked = candidates.map((prop) => {
    const { total, matchScores } = computeRecommendationScore(userDna, prop, weights);
    return {
      property: prop,
      score: Math.round(total * 10000) / 10000,
      match_scores: matchScores,
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

export function generateExplanation(userDna, property, matchScores = {}) {
  const reasons = [];
  if (!userDna || !property) return reasons;

  // Budget
  if (userDna.budget && (matchScores.budget_match ?? NEUTRAL_SCORE) >= STRONG_MATCH_THRESHOLD) {
    reasons.push('Within your budget');
  }

  // Location
  if (
    Array.isArray(userDna.locations) &&
    userDna.locations.length > 0 &&
    (matchScores.location_match ?? NEUTRAL_SCORE) >= STRONG_MATCH_THRESHOLD
  ) {
    const loc = property.location || property.community || 'preferred area';
    reasons.push(`Located in ${loc}, one of your preferred areas`);
  }

  // Property Type
  if (
    Array.isArray(userDna.property_types) &&
    userDna.property_types.length > 0 &&
    (matchScores.property_type_match ?? NEUTRAL_SCORE) >= STRONG_MATCH_THRESHOLD
  ) {
    const typeStr = property.property_type || property.propertyType || property.category || 'residence';
    const article = 'aeiou'.includes(typeStr.charAt(0).toLowerCase()) ? 'An' : 'A';
    reasons.push(`${article} ${typeStr.toLowerCase()}, as you requested`);
  }

  // Bedrooms
  if (
    userDna.bedrooms !== null &&
    userDna.bedrooms !== undefined &&
    (matchScores.bedroom_match ?? NEUTRAL_SCORE) >= STRONG_MATCH_THRESHOLD
  ) {
    const beds = property.bedrooms !== undefined ? property.bedrooms : 0;
    reasons.push(`Matches your ${beds}-bedroom requirement`);
  }

  // Purpose
  if (userDna.purpose && (matchScores.purpose_match ?? NEUTRAL_SCORE) >= STRONG_MATCH_THRESHOLD) {
    const purposePhrases = {
      [Purpose.INVESTMENT]: 'Well suited for investment',
      [Purpose.END_USE]: 'A good fit to live in yourself',
      [Purpose.RENTAL]: 'Suitable for renting out',
    };
    if (purposePhrases[userDna.purpose]) {
      reasons.push(purposePhrases[userDna.purpose]);
    }
  }

  // Transport
  if (
    userDna.transport_preference &&
    (matchScores.transport_match ?? NEUTRAL_SCORE) >= STRONG_MATCH_THRESHOLD
  ) {
    const metroKm = property.nearby_facilities?.metro_distance_km ?? property.nearbyFacilities?.metroDistanceKm ?? property.metroDistanceKm;
    if (typeof metroKm === 'number' && metroKm <= 1.0) {
      reasons.push('Close to the metro');
    }
  }

  // Investment / Yield
  if (
    userDna.rental_yield_preference &&
    (matchScores.investment_match ?? NEUTRAL_SCORE) >= STRONG_MATCH_THRESHOLD
  ) {
    const yieldVal = property.rental_yield ?? property.yield;
    if (typeof yieldVal === 'number' && yieldVal >= 7.0) {
      reasons.push(`High rental potential (${yieldVal.toFixed(1)}% yield)`);
    }
  }

  // Amenities
  if (
    Array.isArray(userDna.amenities) &&
    userDna.amenities.length > 0 &&
    (matchScores.amenity_match ?? NEUTRAL_SCORE) >= STRONG_MATCH_THRESHOLD
  ) {
    const wantedMap = new Map();
    userDna.amenities.forEach((a) => wantedMap.set(normalizeKey(a), a));
    const propAmenities = Array.isArray(property.amenities) ? property.amenities : [];
    const matched = [];
    propAmenities.forEach((a) => {
      const key = normalizeKey(a);
      if (wantedMap.has(key)) {
        matched.push(wantedMap.get(key));
      }
    });

    if (matched.length > 0) {
      reasons.push(`Includes ${matched.join(', ')}`);
    }
  }

  return reasons;
}

export function formatExplanation(reasons = []) {
  if (!reasons || reasons.length === 0) {
    return 'Recommended based on your overall preferences.';
  }
  const bullets = reasons.map((r) => `✓ ${r}`).join('\n');
  return `Recommended because:\n${bullets}`;
}

/**
 * End-to-end recommendation generator pipeline.
 * @param {Object} userDna
 * @param {Array} properties
 * @param {number} topN
 * @param {Object} weights
 * @returns {Array} Ranked property items with score breakdowns and explanations
 */
export function generateRecommendations(userDna, properties = [], topN = 10, weights = DEFAULT_WEIGHTS) {
  const candidates = preFilterCandidates(userDna, properties);
  const ranked = scoreAndRank(userDna, candidates, weights);
  const sliced = ranked.slice(0, topN);

  return sliced.map((item) => ({
    property: item.property,
    score: item.score,
    match_scores: item.match_scores,
    explanation: formatExplanation(generateExplanation(userDna, item.property, item.match_scores)),
  }));
}
