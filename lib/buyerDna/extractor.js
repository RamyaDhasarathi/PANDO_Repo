/**
 * Rule-based NLU Extraction Pipeline for Buyer DNA.
 * Ported from Python pipelines/extraction/ pipeline.py, budget.py, categorical.py
 */

import {
  Purpose,
  TransportPreference,
  RentalYieldPreference,
  createUserDNA,
} from './schema.js';

// Canonical Lists & Aliases
export const CANONICAL_LOCATIONS = [
  'Dubai Marina',
  'Jumeirah Village Circle',
  'Downtown Dubai',
  'Palm Jumeirah',
  'Business Bay',
  'Jumeirah Lake Towers',
  'Arabian Ranches',
  'Dubai Hills Estate',
  'Al Barsha',
  'Dubai Silicon Oasis',
  'Dubai Sports City',
  'Jumeirah Beach Residence',
  'Dubai Creek Harbour',
  'Mirdif',
  'Dubai South',
];

export const LOCATION_ALIASES = {
  'the marina': 'Dubai Marina',
  'marina': 'Dubai Marina',
  'jvc': 'Jumeirah Village Circle',
  'downtown': 'Downtown Dubai',
  'the palm': 'Palm Jumeirah',
  'jlt': 'Jumeirah Lake Towers',
  'jbr': 'Jumeirah Beach Residence',
};

export function getCanonicalLocationKey(rawLoc) {
  if (!rawLoc) return '';
  const lower = String(rawLoc).toLowerCase().trim();
  if (LOCATION_ALIASES[lower]) return normalizeKey(LOCATION_ALIASES[lower]);
  return normalizeKey(rawLoc);
}

export const CANONICAL_PROPERTY_TYPES = [
  'Apartment',
  'Townhouse',
  'Villa',
  'Penthouse',
  'Duplex',
  'Studio',
  'Office',
  'Retail',
  'Warehouse',
  'Land',
];

const PROPERTY_TYPE_ALIASES = {
  'apt': 'Apartment',
  'apts': 'Apartment',
  'flat': 'Apartment',
  'flats': 'Apartment',
  'condo': 'Apartment',
  'condos': 'Apartment',
  'apartments': 'Apartment',
  'town house': 'Townhouse',
  'townhouse': 'Townhouse',
  'townhouses': 'Townhouse',
  'house': 'Villa',
  'villas': 'Villa',
  'penthouses': 'Penthouse',
  'duplexes': 'Duplex',
  'studios': 'Studio',
  'offices': 'Office',
};

export const CANONICAL_AMENITIES = [
  'Gym',
  'Pool',
  'Parking',
  'Security',
  'Garden',
  'Private Beach',
  'Kids Play Area',
  'BBQ Area',
  'Concierge',
  'Sauna',
  'Steam Room',
  'Tennis Court',
  'Pet Friendly',
  'Balcony',
  "Maid's Room",
];

const FX_TO_AED = {
  AED: 1.0,
  USD: 3.6725,
  EUR: 4.0,
  GBP: 4.7,
};

const CURRENCY_SYMBOLS = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  'aed': 'AED',
  'dhs': 'AED',
  'dh': 'AED',
  'usd': 'USD',
  'eur': 'EUR',
  'gbp': 'GBP',
};

export function normalizeKey(text) {
  if (!text) return '';
  return String(text).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function detectCurrency(text) {
  const lower = String(text).toLowerCase();
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (lower.includes(symbol)) {
      return code;
    }
  }
  return 'AED';
}

export function normalizePrice(rawValue) {
  if (rawValue === null || rawValue === undefined) return null;
  if (typeof rawValue === 'number') return rawValue;

  const text = String(rawValue).trim();
  if (!text) return null;

  const currency = detectCurrency(text);
  let multiplier = 1.0;
  const lower = text.toLowerCase();

  if (/million|\bmn\b|\d\s*m\b/i.test(lower)) {
    multiplier = 1000000.0;
  } else if (/thousand|\d\s*k\b/i.test(lower)) {
    multiplier = 1000.0;
  }

  const digits = text.replace(/[^0-9.]/g, '');
  if (!digits) return null;

  const amount = parseFloat(digits);
  if (isNaN(amount)) return null;

  const finalAmount = amount * multiplier * (FX_TO_AED[currency] || 1.0);
  return Math.round(finalAmount * 100) / 100;
}

const MONEY_TOKEN = '(?:aed|dhs?|usd|\\$|€|£)?\\s?[\\d,]+(?:\\.\\d+)?\\s?(?:million|mn|thousand|m|k)?';
const RANGE_PATTERN = new RegExp(`(?<low>${MONEY_TOKEN})\\s*(?:-|to|and)\\s*(?<high>${MONEY_TOKEN})`, 'i');
const UNDER_PATTERN = new RegExp(`(?:under|below|less than|up to|max(?:imum)?(?: of)?|within)\\s*(?<amount>${MONEY_TOKEN})`, 'i');
const OVER_PATTERN = new RegExp(`(?:over|above|more than|at least|min(?:imum)?(?: of)?|starting (?:at|from))\\s*(?<amount>${MONEY_TOKEN})`, 'i');
const AROUND_PATTERN = new RegExp(`(?:around|about|approximately|roughly|~|budget(?: of| is)?)\\s*(?<amount>${MONEY_TOKEN})`, 'i');
const BARE_MONEY_PATTERN = new RegExp(`(?<amount>${MONEY_TOKEN})`, 'gi');

const MIN_PLAUSIBLE_BARE_AMOUNT = 10000;

function looksLikeMoney(token) {
  return /million|mn|thousand|\bm\b|\bk\b|aed|dhs?|usd|\$|€|£/i.test(token);
}

export function extractBudget(text) {
  if (!text) return null;

  const rangeMatch = text.match(RANGE_PATTERN);
  if (rangeMatch && rangeMatch.groups) {
    const low = normalizePrice(rangeMatch.groups.low);
    const high = normalizePrice(rangeMatch.groups.high);
    if (low !== null && high !== null) {
      return { min: Math.min(low, high), max: Math.max(low, high) };
    }
  }

  const underMatch = text.match(UNDER_PATTERN);
  const overMatch = text.match(OVER_PATTERN);
  if (underMatch || overMatch) {
    const maxVal = underMatch && underMatch.groups ? normalizePrice(underMatch.groups.amount) : null;
    const minVal = overMatch && overMatch.groups ? normalizePrice(overMatch.groups.amount) : null;
    if (maxVal !== null || minVal !== null) {
      return { min: minVal, max: maxVal };
    }
  }

  const aroundMatch = text.match(AROUND_PATTERN);
  if (aroundMatch && aroundMatch.groups) {
    const amount = normalizePrice(aroundMatch.groups.amount);
    if (amount !== null) {
      return { min: null, max: amount };
    }
  }

  const matches = [...text.matchAll(BARE_MONEY_PATTERN)];
  for (const match of matches) {
    const token = match.groups ? match.groups.amount : match[0];
    const digits = token.replace(/[^0-9.]/g, '');
    if (!digits) continue;
    const val = parseFloat(digits);
    if (looksLikeMoney(token) || val >= MIN_PLAUSIBLE_BARE_AMOUNT) {
      const amount = normalizePrice(token);
      if (amount !== null && amount >= MIN_PLAUSIBLE_BARE_AMOUNT) {
        return { min: null, max: amount };
      }
    }
  }

  return null;
}

function findAllCanonical(text, canonicalList, aliases = {}) {
  const lower = String(text).toLowerCase();
  const found = [];

  for (const canonical of canonicalList) {
    if (lower.includes(canonical.toLowerCase()) && !found.includes(canonical)) {
      found.push(canonical);
    }
  }

  for (const [alias, canonical] of Object.entries(aliases)) {
    const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower) && !found.includes(canonical)) {
      found.push(canonical);
    }
  }

  return found;
}

export function extractLocations(text) {
  return findAllCanonical(text, CANONICAL_LOCATIONS, LOCATION_ALIASES);
}

export function extractPropertyTypes(text) {
  return findAllCanonical(text, CANONICAL_PROPERTY_TYPES, PROPERTY_TYPE_ALIASES);
}

export function extractAmenities(text) {
  return findAllCanonical(text, CANONICAL_AMENITIES, {});
}

export function extractBedrooms(text) {
  if (!text) return null;
  const bedRegex = /(?<n>\d+)\s*(?:-|\s)?(?:bed(?:room)?s?|br|bhk)\b/i;
  const studioRegex = /\bstudio\b/i;

  const matchBed = text.match(bedRegex);
  if (matchBed && matchBed.groups && matchBed.groups.n) {
    return parseInt(matchBed.groups.n, 10);
  }

  if (studioRegex.test(text)) {
    return 0; // Studio = 0 bedrooms
  }

  return null;
}

const PURPOSE_PATTERNS = {
  [Purpose.INVESTMENT]: [/invest/i, /capital appreciation/i, /\bflip\b/i],
  [Purpose.RENTAL]: [/rent (?:it |them )?out/i, /rental income/i, /buy to let/i, /let out/i],
  [Purpose.END_USE]: [/live in/i, /to live/i, /for my family/i, /own use/i, /end use/i, /move in/i],
};

export function extractPurpose(text) {
  if (!text) return null;
  for (const [purpose, patterns] of Object.entries(PURPOSE_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(text))) {
      return purpose;
    }
  }
  return null;
}

const TRANSPORT_KEYWORDS = ['near metro', 'close to metro', 'near the metro', 'metro station', 'walking distance to metro'];

export function extractTransportPreference(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (TRANSPORT_KEYWORDS.some((kw) => lower.includes(kw)) || /\bmetro\b/i.test(lower)) {
    return TransportPreference.NEAR_METRO;
  }
  return null;
}

const YIELD_KEYWORDS = {
  [RentalYieldPreference.HIGH]: ['high yield', 'high rental yield', 'good returns', 'strong returns', 'high roi'],
  [RentalYieldPreference.MEDIUM]: ['moderate yield', 'average yield', 'decent returns'],
  [RentalYieldPreference.LOW]: ['low yield', 'not concerned about yield'],
};

export function extractRentalYieldPreference(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [preference, keywords] of Object.entries(YIELD_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return preference;
    }
  }
  return null;
}

/**
 * Extracts a complete UserDNA profile from free-form conversation text.
 * @param {string} conversationText
 * @returns {Object} UserDNA
 */
export function extractUserDNA(conversationText) {
  const text = conversationText || '';
  return createUserDNA({
    budget: extractBudget(text),
    locations: extractLocations(text),
    property_types: extractPropertyTypes(text),
    bedrooms: extractBedrooms(text),
    purpose: extractPurpose(text),
    amenities: extractAmenities(text),
    transport_preference: extractTransportPreference(text),
    rental_yield_preference: extractRentalYieldPreference(text),
  });
}
