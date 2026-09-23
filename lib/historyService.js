export async function recordPropertyView(property) {
  if (!property) return;
  const propId = property.id || property._id || property.originalId;
  if (!propId) return;

  const item = {
    propertyId: propId,
    title: property.title || property.name || 'Residences',
    location: `${property.community || property.location || ''}${property.city ? ', ' + property.city : ''}`,
    price: property.price || 0,
    image: (property.images && property.images[0]) || property.image || '/images/pando-agent.png',
    viewedAt: new Date().toISOString(),
  };

  // 1. Update localStorage
  try {
    const existing = JSON.parse(localStorage.getItem('pando_recent_history') || '[]');
    const filtered = existing.filter((h) => h.propertyId !== propId);
    filtered.unshift(item);
    const updated = filtered.slice(0, 4);
    localStorage.setItem('pando_recent_history', JSON.stringify(updated));
  } catch (e) {
    console.error('LocalStorage history save error:', e);
  }

  // 2. Sync to Backend API
  try {
    await fetch('/api/buyer/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
  } catch (e) {
    // Silent fail if offline or unauthenticated
  }
}

export async function fetchPropertyHistory() {
  // 1. Try Backend API
  try {
    const res = await fetch('/api/buyer/history');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.history && data.history.length > 0) {
        return data.history;
      }
    }
  } catch (e) {}

  // 2. Fallback to LocalStorage
  try {
    const local = JSON.parse(localStorage.getItem('pando_recent_history') || '[]');
    return local.slice(0, 4);
  } catch (e) {
    return [];
  }
}
