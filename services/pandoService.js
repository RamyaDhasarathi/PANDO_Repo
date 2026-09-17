import { PROPERTIES_DATA } from '@/data/quantumProperties';

export class PandoService {
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

    // Simple dynamic generator
    return `${name} in ${loc} offers ${beds} bedrooms, ${area} sq.ft of luxury living space at a valuation of ${price}.`;
  }

  /**
   * Process dynamic user text commands about prices, bedrooms, amenities, locations, or comparisons.
   */
  static processQuery(query, properties = []) {
    const q = query.toLowerCase().trim();
    if (!properties || properties.length === 0) {
      return {
        reply: "I couldn't find any properties in the current database that match.",
        matchingIds: [],
        selectedId: null,
      };
    }

    const formatAedNum = (val) => val ? (val / 1000000).toFixed(1).replace('.0', '') : '0';

    // 1. Under budget queries
    if (q.includes('under') || q.includes('below') || q.includes('less than') || q.includes('cheapest') || q.includes('affordable')) {
      const match = q.match(/(under|below|less than)\s*(\d+)/i);
      let threshold = 50000000; // Default 50M
      if (match && match[2]) {
        threshold = parseInt(match[2], 10) * 1000000;
      } else if (q.includes('70')) threshold = 70000000;
      else if (q.includes('65')) threshold = 65000000;
      else if (q.includes('60')) threshold = 60000000;
      else if (q.includes('50')) threshold = 50000000;

      const matches = properties.filter((p) => p.price && p.price < threshold);
      if (matches.length > 0) {
        const first = matches[0];
        const matchNames = matches.slice(0, 3).map((m) => `${m.title || m.name} (AED ${formatAedNum(m.price)}M)`).join(', ');
        return {
          reply: `I found ${matches.length} properties under AED ${threshold / 1000000}M: ${matchNames}. The top match offers ${(first.areaSqft || first.area || 0).toLocaleString()} sq.ft.`,
          matchingIds: matches.map((m) => m.id),
          selectedId: first.id,
        };
      }
    }

    // 2. Most expensive
    if (q.includes('most expensive') || q.includes('highest price') || q.includes('highest valuation') || q.includes('priciest')) {
      const highest = [...properties].sort((a, b) => (b.price || 0) - (a.price || 0))[0];
      return {
        reply: `${highest.title || highest.name} is the most valuable residence in the current view at AED ${formatAedNum(highest.price)} million. It features ${highest.bedrooms || 0} bedrooms.`,
        matchingIds: [highest.id],
        selectedId: highest.id,
      };
    }

    // 3. Most bedrooms / Largest space
    if (q.includes('most bedroom') || q.includes('highest bedrooms') || q.includes('largest') || q.includes('biggest')) {
      const mostBeds = [...properties].sort((a, b) => (b.bedrooms || 0) - (a.bedrooms || 0))[0];
      return {
        reply: `${mostBeds.title || mostBeds.name} has the most bedrooms with ${mostBeds.bedrooms || 0} bedrooms and an expansive footprint of ${(mostBeds.areaSqft || mostBeds.area || 0).toLocaleString()} sq.ft.`,
        matchingIds: [mostBeds.id],
        selectedId: mostBeds.id,
      };
    }

    // 4. Comparison queries
    if (q.includes('compare')) {
      if (properties.length >= 2) {
        const p1 = properties[0];
        const p2 = properties[1];
        return {
          reply: `Comparing the top two: ${p1.title || p1.name} offers ${p1.bedrooms || 0} beds at AED ${formatAedNum(p1.price)}M, while ${p2.title || p2.name} offers ${p2.bedrooms || 0} beds at AED ${formatAedNum(p2.price)}M.`,
          matchingIds: [p1.id, p2.id],
          selectedId: p1.id,
        };
      }
    }

    // 5. Specific Locations / Mentions
    const locations = ['palm', 'jumeirah', 'hills', 'golf', 'marina', 'yacht', 'downtown', 'burj', 'opera'];
    for (const loc of locations) {
      if (q.includes(loc)) {
        const locMatch = properties.filter(p => 
          (p.community || '').toLowerCase().includes(loc) || 
          (p.title || '').toLowerCase().includes(loc) ||
          (p.description || '').toLowerCase().includes(loc)
        );
        if (locMatch.length > 0) {
          const top = locMatch[0];
          return {
            reply: `Found ${locMatch.length} matches for "${loc}". Top option: ${this.getPropertyExplanation(top)}`,
            matchingIds: locMatch.map(m => m.id),
            selectedId: top.id,
          };
        }
      }
    }

    // Default dynamic fallback
    const firstProp = properties[0];
    const topValuations = properties.slice(0, 3).map(p => `${p.community || 'Dubai'} (${formatAedNum(p.price)}M)`).join(', ');
    return {
      reply: `Analyzing "${query}" against the available properties. The top valuations in this view include ${topValuations}. Let's look at ${firstProp.title || firstProp.name}.`,
      matchingIds: properties.map((p) => p.id),
      selectedId: firstProp.id,
    };
  }
}
