import { PROPERTIES_DATA } from '@/data/quantumProperties';
import { extractUserDNA } from '@/lib/buyerDna';

export class PandoService {
  /**
   * Greeting shown in Pando's bubble when the results page first loads (or
   * filters/page change) — a short, curiosity-driving teaser built purely
   * from stats and standout features of the residences on screen.
   */
  static getSummaryMessage(pageProperties = [], searchContext = {}) {
    if (!pageProperties || !pageProperties.length) {
      return searchContext.searchQuery
        ? `I couldn't find any properties matching "${searchContext.searchQuery}". Try broadening your filters.`
        : "No matching residences found — try widening your location or typology filters.";
    }

    const formatAed = (val) => {
      if (!val) return '0 dirhams';
      if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + ' million dirhams';
      if (val >= 1000) return (val / 1000).toFixed(1).replace('.0', '') + ' thousand dirhams';
      return val + ' dirhams';
    };

    const firstProp = pageProperties[0];
    const firstTitle = firstProp.title || firstProp.name || 'Featured Residence';
    const firstLoc = firstProp.community || firstProp.location || 'Dubai';
    const firstPrice = formatAed(firstProp.price);
    const total = pageProperties.length;
    const communities = [...new Set(pageProperties.map((p) => p.community || p.location).filter(Boolean))];

    if (searchContext.searchQuery) {
      return `I found ${total} luxury ${total === 1 ? 'residence' : 'residences'} matching "${searchContext.searchQuery}". Top option: ${firstTitle} in ${firstLoc} valued at ${firstPrice}.`;
    }

    const activeFilterParts = [];
    if (searchContext.selectedLocation && searchContext.selectedLocation !== 'all') {
      activeFilterParts.push(`in ${searchContext.selectedLocation}`);
    }
    if (searchContext.selectedType && searchContext.selectedType !== 'all') {
      activeFilterParts.push(`type ${searchContext.selectedType}`);
    }
    if (searchContext.selectedPrice && searchContext.selectedPrice !== 'all') {
      activeFilterParts.push(`price bracket ${searchContext.selectedPrice}`);
    }

    if (activeFilterParts.length > 0) {
      return `I found ${total} luxury ${total === 1 ? 'residence' : 'residences'} matching your criteria (${activeFilterParts.join(', ')}). Top option: ${firstTitle} in ${firstLoc} at ${firstPrice}.`;
    }

    const locText = communities.length > 0 ? `across ${communities.slice(0, 2).join(' and ')}` : 'in Dubai';
    return `Tracking ${total} luxury residences ${locText}. Top recommendation: ${firstTitle} in ${firstLoc} valued at ${firstPrice}. Click any card to inspect details.`;
  }

  /**
   * Generate property-specific speech explanation when a user clicks a property card.
   */
  static getPropertyExplanation(property) {
    if (!property) return "Select any luxury residence to synthesize AI property intelligence.";
    const formatAed = (val) => {
      if (!val) return '0 dirhams';
      if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + ' million dirhams';
      if (val >= 1000) return (val / 1000).toFixed(1).replace('.0', '') + ' thousand dirhams';
      return val + ' dirhams';
    };

    const name = property.title || property.name || 'This residence';
    const beds = property.bedrooms || 0;
    const area = (property.areaSqft || property.area || 0).toLocaleString();
    const price = formatAed(property.price);
    const loc = property.community || property.location || 'Dubai';

    return `${name} in ${loc} offers ${beds} bedrooms, ${area} sq.ft of luxury living space at a valuation of ${price}.`;
  }

  /**
   * Process dynamic user text commands about prices, bedrooms, amenities, locations, or comparisons.
   */
  static processQuery(query, properties = []) {
    const q = query.toLowerCase().trim();
    const userDna = extractUserDNA(query);

    // Full catalog fallback for cross-location searches
    const fullCatalog = Array.isArray(PROPERTIES_DATA) && PROPERTIES_DATA.length > 0 ? PROPERTIES_DATA : properties;
    const pool = (properties && properties.length > 0) ? properties : fullCatalog;

    const formatAedNum = (val) => val ? (val / 1000000).toFixed(1).replace('.0', '') : '0';

    // 1. Specific Location Search (e.g., "downtown dubai", "palm jumeirah", "dubai hills", "marina", "jvc")
    const knownLocationsMap = {
      'downtown dubai': 'Downtown Dubai',
      'downtown': 'Downtown Dubai',
      'palm jumeirah': 'Palm Jumeirah',
      'palm jumeira': 'Palm Jumeirah',
      'palm': 'Palm Jumeirah',
      'dubai hills estate': 'Dubai Hills Estate',
      'dubai hills': 'Dubai Hills Estate',
      'hills': 'Dubai Hills Estate',
      'dubai harbour': 'Dubai Harbour',
      'harbour': 'Dubai Harbour',
      'dubai marina': 'Dubai Marina',
      'marina': 'Dubai Marina',
      'jumeirah village circle': 'Jumeirah Village Circle',
      'jvc': 'Jumeirah Village Circle',
      'business bay': 'Business Bay',
      'the oasis': 'The Oasis',
      'oasis': 'The Oasis',
    };

    for (const [key, canonicalLoc] of Object.entries(knownLocationsMap)) {
      if (q.includes(key)) {
        // Search across full catalog for matching location
        const locMatches = fullCatalog.filter(p =>
          (p.community || p.location || '').toLowerCase().includes(key) ||
          (p.community || p.location || '').toLowerCase().includes(canonicalLoc.toLowerCase()) ||
          (p.title || p.name || '').toLowerCase().includes(key)
        );

        if (locMatches.length > 0) {
          const top = locMatches[0];
          return {
            reply: `I found ${locMatches.length} luxury residences matching "${canonicalLoc}". Top recommendation: ${this.getPropertyExplanation(top)}`,
            matchingIds: locMatches.map(m => m.id || m._id),
            selectedId: top.id || top._id,
            userDna,
            triggerSearchQuery: query,
            extractedLocation: canonicalLoc,
          };
        }
      }
    }

    // 2. Under budget queries
    if (q.includes('under') || q.includes('below') || q.includes('less than') || q.includes('cheapest') || q.includes('affordable')) {
      const match = q.match(/(under|below|less than)\s*(\d+)/i);
      let threshold = 50000000; // Default 50M
      if (match && match[2]) {
        threshold = parseInt(match[2], 10) * 1000000;
      } else if (q.includes('70')) threshold = 70000000;
      else if (q.includes('65')) threshold = 65000000;
      else if (q.includes('60')) threshold = 60000000;
      else if (q.includes('50')) threshold = 50000000;

      const matches = pool.filter((p) => p.price && p.price < threshold);
      if (matches.length > 0) {
        const first = matches[0];
        const matchNames = matches.slice(0, 3).map((m) => `${m.title || m.name} (AED ${formatAedNum(m.price)}M)`).join(', ');
        return {
          reply: `I found ${matches.length} properties under AED ${threshold / 1000000}M: ${matchNames}. The top match offers ${(first.areaSqft || first.area || 0).toLocaleString()} sq.ft.`,
          matchingIds: matches.map((m) => m.id || m._id),
          selectedId: first.id || first._id,
          userDna,
        };
      }
    }

    // 3. Most expensive
    if (q.includes('most expensive') || q.includes('highest price') || q.includes('highest valuation') || q.includes('priciest')) {
      const highest = [...pool].sort((a, b) => (b.price || 0) - (a.price || 0))[0];
      if (highest) {
        return {
          reply: `${highest.title || highest.name} is the most valuable residence in the current view at AED ${formatAedNum(highest.price)} million. It features ${highest.bedrooms || 0} bedrooms.`,
          matchingIds: [highest.id || highest._id],
          selectedId: highest.id || highest._id,
          userDna,
        };
      }
    }

    // 4. Most bedrooms / Largest space
    if (q.includes('most bedroom') || q.includes('highest bedrooms') || q.includes('largest') || q.includes('biggest')) {
      const mostBeds = [...pool].sort((a, b) => (b.bedrooms || 0) - (a.bedrooms || 0))[0];
      if (mostBeds) {
        return {
          reply: `${mostBeds.title || mostBeds.name} has the most bedrooms with ${mostBeds.bedrooms || 0} bedrooms and an expansive footprint of ${(mostBeds.areaSqft || mostBeds.area || 0).toLocaleString()} sq.ft.`,
          matchingIds: [mostBeds.id || mostBeds._id],
          selectedId: mostBeds.id || mostBeds._id,
          userDna,
        };
      }
    }

    // Default dynamic fallback
    const firstProp = pool[0];
    const topValuations = pool.slice(0, 3).map(p => `${p.community || p.location || 'Dubai'} (${formatAedNum(p.price)}M)`).join(', ');
    return {
      reply: `Analyzing "${query}" against available residences. Top options include ${topValuations}. Recommended option: ${firstProp ? (firstProp.title || firstProp.name) : 'Featured Residence'}.`,
      matchingIds: pool.map((p) => p.id || p._id),
      selectedId: firstProp ? (firstProp.id || firstProp._id) : null,
      userDna,
    };
  }
}

