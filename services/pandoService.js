import { PROPERTIES_DATA } from '@/data/quantumProperties';

export class PandoService {
  /**
   * Greeting shown in Pando's bubble when the results page first loads (or
   * filters/page change) — a short, curiosity-driving teaser built purely
   * from stats and standout features of the residences on screen. Never
   * names a property or its location — that's the reveal you get by
   * hovering or opening a card — so it stays a hook, not a recap.
   */
  static getSummaryMessage(pageProperties = []) {
    if (!pageProperties.length) {
      return "No matches yet — try widening your filters.";
    }

    const maxBedrooms = Math.max(...pageProperties.map((p) => p.bedrooms));
    const maxYield = Math.max(...pageProperties.map((p) => p.yield));
    const hooks = [...new Set(pageProperties.flatMap((p) => p.tags || []))].slice(0, 2);
    const hookSummary = hooks.length ? hooks.join(' and ').toLowerCase() : 'standout amenities';

    return `Up to ${maxBedrooms} bedrooms, ${maxYield}% net yield, and ${hookSummary} — take a closer look.`;
  }

  /**
   * Generate property-specific speech explanation when a user clicks a property card.
   */
  static getPropertyExplanation(property) {
    if (!property) return "Select any luxury residence to synthesize AI property intelligence.";
    const formatAed = (val) => (val / 1000000).toFixed(1) + ' million';

    switch (property.id) {
      case 'prop-1':
        return `Palm Jumeirah is a premier beachfront sanctuary with ${property.bedrooms} bedrooms, ${property.area.toLocaleString()} sq.ft and private mooring. Current valuation is AED 85 million and available off-market.`;

      case 'prop-2':
        return `Dubai Hills Estate is a fairway mansion offering ${property.bedrooms} bedrooms across ${property.area.toLocaleString()} sq.ft. It includes a basement cinema, championship golf views, and an 8-car garage at AED ${formatAed(property.price)}.`;

      case 'prop-3':
        return `Dubai Marina is a triple-height sky villa penthouse with ${property.bedrooms} bedrooms, ${property.area.toLocaleString()} sq.ft, private lift, and panoramic Ain Dubai skyline views, offered at AED ${formatAed(property.price)}.`;

      case 'prop-4':
        return `Downtown Dubai is a royal elevation penthouse with ${property.bedrooms} bedrooms and ${property.area.toLocaleString()} sq.ft. It features direct unobstructed Burj Khalifa views and private sky pool at AED ${formatAed(property.price)}.`;

      default:
        return `${property.name} offers ${property.bedrooms} bedrooms, ${property.area.toLocaleString()} sq.ft of luxury living space at a valuation of AED ${formatAed(property.price)}.`;
    }
  }

  /**
   * Process dynamic user text commands about prices, bedrooms, amenities, locations, or comparisons.
   */
  static processQuery(query, properties = PROPERTIES_DATA) {
    const q = query.toLowerCase().trim();

    // 1. Under budget queries (e.g., "under 50m", "less than 60 million", "under 50 million")
    if (q.includes('under') || q.includes('below') || q.includes('less than') || q.includes('cheapest') || q.includes('affordable')) {
      if (q.includes('50') || q.includes('50m') || q.includes('50 million') || q.includes('cheapest') || q.includes('affordable')) {
        const matches = properties.filter((p) => p.price < 50000000);
        if (matches.length > 0) {
          const matchNames = matches.map((m) => `${m.name} at AED ${(m.price / 1000000).toFixed(1)}M`).join(', ');
          const first = matches[0];
          return {
            reply: `I found ${matches.length} strong match under AED 50M: ${matchNames}. It offers ${first.bedrooms} bedrooms, ${first.area.toLocaleString()} sq.ft, private elevator, and panoramic skyline views.`,
            matchingIds: matches.map((m) => m.id),
            selectedId: first.id,
          };
        }
      }

      if (q.includes('70') || q.includes('65') || q.includes('60')) {
        const matches = properties.filter((p) => p.price <= 65000000);
        return {
          reply: `Found ${matches.length} properties under AED 65M: Dubai Marina (AED 44.5M), Downtown Dubai (AED 52M), and Dubai Hills Estate (AED 62M).`,
          matchingIds: matches.map((m) => m.id),
          selectedId: matches[0].id,
        };
      }
    }

    // 2. Most expensive / Highest valuation
    if (q.includes('most expensive') || q.includes('highest price') || q.includes('highest valuation') || q.includes('priciest')) {
      const highest = [...properties].sort((a, b) => b.price - a.price)[0];
      return {
        reply: `${highest.name} is the most valuable residence in the collection at AED ${(highest.price / 1000000).toFixed(1)} million. It features ${highest.bedrooms} bedrooms, ${highest.area.toLocaleString()} sq.ft, and private beachfront superyacht mooring.`,
        matchingIds: [highest.id],
        selectedId: highest.id,
      };
    }

    // 3. Most bedrooms / Largest space
    if (q.includes('most bedroom') || q.includes('highest bedrooms') || q.includes('largest') || q.includes('biggest') || q.includes('7 bed') || q.includes('7 bedroom')) {
      const mostBeds = [...properties].sort((a, b) => b.bedrooms - a.bedrooms)[0];
      return {
        reply: `${mostBeds.name} has the most bedrooms with ${mostBeds.bedrooms} bedrooms and an expansive footprint of ${mostBeds.area.toLocaleString()} sq.ft set on the golf course fairway.`,
        matchingIds: [mostBeds.id],
        selectedId: mostBeds.id,
      };
    }

    // 4. Comparison queries (e.g. "compare palm jumeirah and dubai hills", "compare")
    if (q.includes('compare') || (q.includes('palm') && q.includes('hills'))) {
      const palm = properties.find((p) => p.id === 'prop-1') || properties[0];
      const hills = properties.find((p) => p.id === 'prop-2') || properties[1];
      return {
        reply: `Palm Jumeirah offers 6 bedrooms and 8,400 sq.ft at AED 85M, while Dubai Hills Estate offers 7 bedrooms and 11,200 sq.ft at AED 62M. Dubai Hills provides more interior space at a lower valuation, whereas Palm Jumeirah offers prime beachfront lifestyle.`,
        matchingIds: [palm.id, hills.id],
        selectedId: palm.id,
      };
    }

    // 5. Specific Property Mentions
    if (q.includes('palm') || q.includes('jumeirah')) {
      const palm = properties.find((p) => p.id === 'prop-1') || properties[0];
      return {
        reply: this.getPropertyExplanation(palm),
        matchingIds: [palm.id],
        selectedId: palm.id,
      };
    }

    if (q.includes('hills') || q.includes('golf')) {
      const hills = properties.find((p) => p.id === 'prop-2') || properties[1];
      return {
        reply: this.getPropertyExplanation(hills),
        matchingIds: [hills.id],
        selectedId: hills.id,
      };
    }

    if (q.includes('marina') || q.includes('yacht')) {
      const marina = properties.find((p) => p.id === 'prop-3') || properties[2];
      return {
        reply: this.getPropertyExplanation(marina),
        matchingIds: [marina.id],
        selectedId: marina.id,
      };
    }

    if (q.includes('downtown') || q.includes('burj') || q.includes('opera')) {
      const downtown = properties.find((p) => p.id === 'prop-4') || properties[3];
      return {
        reply: this.getPropertyExplanation(downtown),
        matchingIds: [downtown.id],
        selectedId: downtown.id,
      };
    }

    // 6. Waterfront / Beachfront / Skyline category filter queries
    if (q.includes('waterfront') || q.includes('beach') || q.includes('ocean') || q.includes('lagoon')) {
      const matches = properties.filter((p) => p.id === 'prop-1' || p.id === 'prop-3');
      return {
        reply: `Here are the prime waterfront residences: Palm Jumeirah (AED 85M Beachfront Villa with private mooring) and Dubai Marina (AED 44.5M Penthouse with yacht club access).`,
        matchingIds: matches.map((m) => m.id),
        selectedId: matches[0]?.id,
      };
    }

    if (q.includes('pool') || q.includes('infinity') || q.includes('spa') || q.includes('cinema')) {
      return {
        reply: `All 4 residences feature private wellness amenities. Palm Jumeirah & Downtown feature heated infinity pools, Dubai Hills includes a Dolby Atmos cinema, and Dubai Marina has a cantilevered sky plunge pool.`,
        matchingIds: properties.map((m) => m.id),
        selectedId: properties[0]?.id,
      };
    }

    // Default fallback intelligent AI response
    return {
      reply: `Analyzing "${query}" against our prime Dubai portfolios. Palm Jumeirah (85M), Dubai Hills (62M), Downtown (52M), and Dubai Marina (44.5M) represent top tier liquidity and luxury benchmarks.`,
      matchingIds: properties.map((p) => p.id),
      selectedId: properties[0]?.id,
    };
  }
}
