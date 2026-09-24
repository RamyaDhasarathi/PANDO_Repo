/**
 * Dynamic Real-Time Interaction Logging Service
 * Records buyer chat queries, search events, property views, and favorites to MongoDB collection: hi_pando_interactions
 */

export async function logRealtimeInteraction({
  event = 'CHAT_QUERY',
  propertyId = '',
  query = '',
  reply = '',
  recommendationScore = null,
  userDna = null,
  matchScores = null,
  userId = null,
}) {
  try {
    let activeUserId = userId;
    if (!activeUserId && typeof window !== 'undefined') {
      try {
        const storedUser = JSON.parse(localStorage.getItem('pando_user') || '{}');
        activeUserId = storedUser.id || storedUser._id || storedUser.userId || null;
      } catch (e) {}
    }

    await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        propertyId,
        query,
        reply,
        recommendationScore,
        userDna,
        matchScores,
        userId: activeUserId || undefined,
      }),
    });
  } catch (err) {
    // Silent fail if offline or network error
    console.warn('Interaction log sync warning:', err);
  }
}

