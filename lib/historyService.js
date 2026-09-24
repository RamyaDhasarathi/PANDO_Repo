export async function recordSearchQuery(queryText, filters = {}) {
  if (!queryText && !filters.location && !filters.type && !filters.bedroom) return;

  // Build clean search query label
  let label = queryText?.trim();
  if (!label) {
    const parts = [];
    if (filters.bedroom) parts.push(`${filters.bedroom}BR`);
    if (filters.type) parts.push(filters.type);
    if (filters.location) parts.push(`in ${filters.location}`);
    if (filters.purpose) parts.push(`(${filters.purpose === 'rent' ? 'Rent' : 'Buy'})`);
    label = parts.join(' ') || 'Dubai Property Search';
  }

  const metaText = `Searched for ${filters.purpose === 'rent' ? 'Rent' : 'Buy'}${filters.bedroom ? ' • ' + filters.bedroom + ' Bed' : ''}${filters.type ? ' • ' + filters.type : ''}${filters.location ? ' in ' + filters.location : ''}`;

  const item = {
    query: label,
    answer: `Search filter used to find this residence: ${label}`,
    meta: metaText,
    location: filters.location || '',
    bedroom: filters.bedroom || '',
    type: filters.type || '',
    timestamp: new Date().toISOString(),
  };

  // 1. Save to LocalStorage search history
  try {
    const existing = JSON.parse(localStorage.getItem('pando_user_search_history') || '[]');
    const filtered = existing.filter((h) => h.query.toLowerCase() !== label.toLowerCase());
    filtered.unshift(item);
    const updated = filtered.slice(0, 10);
    localStorage.setItem('pando_user_search_history', JSON.stringify(updated));
  } catch (e) {
    console.error('LocalStorage search history error:', e);
  }

  // 2. Sync to Backend API
  try {
    await fetch('/api/buyer/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: 'search_query',
        query: label,
        answer: metaText,
        title: label,
        location: filters.location || '',
      }),
    });
  } catch (e) {}
}

const KNOWN_COMMUNITIES = [
  'palm jumeirah', 'palm jumeira', 'palm',
  'dubai hills estate', 'dubai hills', 'hills',
  'downtown dubai', 'downtown',
  'dubai harbour', 'dubai marina', 'marina',
  'jumeirah village circle', 'jvc',
  'the oasis', 'business bay', 'creek harbour', 'dubai creek', 'jbr', 'jumeirah beach',
  'jlt', 'jumeirah lake towers', 'dubai south', 'al barsha', 'arabian ranches',
  'damac lagoons', 'sobha hartland', 'meydan', 'mirdif', 'silicon oasis', 'dso'
];

function isConflictingCommunity(text, targetComm) {
  if (!text || !targetComm) return false;
  const lowerText = text.toLowerCase();
  const lowerTarget = targetComm.toLowerCase();

  // Find target community tokens (e.g. 'palm', 'jumeirah' for 'Palm Jumeirah')
  const targetTokens = lowerTarget.split(' ').filter(t => t.length > 2);

  for (const comm of KNOWN_COMMUNITIES) {
    if (lowerText.includes(comm)) {
      const isTargetComm = targetTokens.some(t => comm.includes(t) || t.includes(comm));
      if (!isTargetComm) {
        // Query mentions another community (e.g. 'jvc' or 'palm' on a different community property)
        return true;
      }
    }
  }
  return false;
}


export async function fetchSpecificPropertyHistory(property) {
  if (!property) return [];
  const propId = property.id || property._id || property.originalId;
  const community = property.community || property.location || 'Dubai';
  const bdCount = property.bedrooms || 3;
  const bdLabel = bdCount === 0 ? 'Studio' : `${bdCount} BHK`;
  const propType = property.propertyType || property.category || property.type || 'Residence';
  const purposeLabel = property.purpose === 'rent' ? 'Rent' : 'Buy';

  // 1. Retrieve user's actual search history queries
  let userSearchHistory = [];
  try {
    userSearchHistory = JSON.parse(localStorage.getItem('pando_user_search_history') || '[]');
  } catch (e) {}

  // Try Backend API for search query records
  try {
    const res = await fetch(`/api/buyer/history?propertyId=search_query`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.history && data.history.length > 0) {
        const apiHistory = data.history.map((h) => ({
          query: h.query || h.title,
          answer: `Search filter used: ${h.query || h.title}`,
          meta: h.answer || h.location || 'Recent search query',
        }));
        userSearchHistory = [...userSearchHistory, ...apiHistory];
      }
    }
  } catch (e) {}

  // 2. STRICT FILTER: Keep ONLY user searches matching THIS property's community & EXCLUDE all conflicting communities
  const matchedUserSearches = userSearchHistory.filter((item) => {
    const qText = `${item.query || ''} ${item.meta || ''}`;
    // Reject immediately if query belongs to another community (e.g. 'palm' on a 'dubai hills' property)
    if (isConflictingCommunity(qText, community)) {
      return false;
    }
    return true;
  });

  // 3. Build community-specific fallback search queries (strictly for THIS property's location/specs)
  const defaultSearchTrail = [
    {
      query: `${bdLabel} in ${community}`,
      answer: `You searched for "${bdLabel} in ${community}" to discover ${property.title || 'this property'}.`,
      meta: `Searched for ${purposeLabel} • ${bdLabel} in ${community}`,
    },
    {
      query: `${propType}s in ${community}`,
      answer: `Filter applied: ${propType}s in ${community} (${purposeLabel}).`,
      meta: `Searched for ${purposeLabel} • ${propType}s in ${community}`,
    },
    {
      query: `Properties in ${community}`,
      answer: `Explored residential properties across ${community}.`,
      meta: `Searched for ${purposeLabel} in ${community}`,
    },
  ];

  // Merge strictly matched user searches with community-specific fallbacks
  const merged = [...matchedUserSearches, ...defaultSearchTrail];

  // Deduplicate by query text
  const seen = new Set();
  const finalItems = [];
  for (const item of merged) {
    const qKey = (item.query || '').trim().toLowerCase();
    if (qKey && !seen.has(qKey)) {
      seen.add(qKey);
      finalItems.push({
        query: item.query,
        answer: item.answer || `Search query: ${item.query}`,
        meta: item.meta || item.answer || `Searched for ${community}`,
      });
    }
  }

  return finalItems.slice(0, 4);
}

export async function recordSpecificPropertyInteraction(propertyId, queryText, answerText) {
  if (!propertyId || !queryText) return;
  try {
    await fetch('/api/buyer/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: String(propertyId),
        query: queryText,
        answer: answerText || 'Property Inquiry',
        title: queryText,
      }),
    });
  } catch (e) {}
}





