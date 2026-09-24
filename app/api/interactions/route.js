import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import Interaction from '@/lib/models/Interaction';
import { extractUserDNA } from '@/lib/buyerDna';

export const dynamic = 'force-dynamic';

async function getUserId() {
  const token = cookies().get('auth_token')?.value;
  if (!token) return 'GUEST_USER';
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'hi-pando-super-secret-jwt-key-change-in-prod');
    const { payload } = await jwtVerify(token, secret);
    return payload.userId || 'GUEST_USER';
  } catch (err) {
    return 'GUEST_USER';
  }
}

// Allowed Atlas $jsonSchema enum values for event
const ALLOWED_ATLAS_EVENTS = new Set([
  'PROPERTY_SHOWN',
  'PROPERTY_CLICKED',
  'PROPERTY_VIEWED',
  'PROPERTY_SAVED',
  'PROPERTY_SHORTLISTED',
  'PROPERTY_REJECTED',
  'BROKER_CONTACTED',
  'VIEWING_REQUESTED'
]);

export async function POST(req) {
  try {
    const body = await req.json();
    const { event, propertyId, query, reply, recommendationScore, userDna: inputDna, matchScores, userId: inputUserId } = body;

    const cookieUserId = await getUserId();
    const userId = (inputUserId && typeof inputUserId === 'string' && inputUserId !== 'GUEST_USER') ? inputUserId : cookieUserId;

    // Map incoming event to valid Atlas-compliant schema enums
    let safeEvent = String(event || 'PROPERTY_SHOWN').toUpperCase();
    if (!ALLOWED_ATLAS_EVENTS.has(safeEvent)) {
      if (safeEvent === 'FAVORITE_TOGGLED') {
        safeEvent = 'PROPERTY_SAVED';
      } else if (safeEvent === 'CHAT_QUERY' || safeEvent === 'SEARCH_FILTER') {
        safeEvent = (propertyId && propertyId !== 'PROPERTIES_ALL') ? 'PROPERTY_CLICKED' : 'PROPERTY_SHOWN';
      } else {
        safeEvent = 'PROPERTY_SHOWN';
      }
    }

    // Compute Buyer DNA automatically if missing and query exists
    let computedDna = inputDna || null;
    if (!computedDna && query) {
      computedDna = extractUserDNA(query);
    }

    await dbConnect();

    const docPayload = {
      userId: userId || 'GUEST_USER',
      propertyId: propertyId ? String(propertyId) : 'PROPERTIES_ALL',
      event: safeEvent,
      query: query || '',
      reply: reply || '',
      recommendationScore: typeof recommendationScore === 'number' ? Math.max(0, Math.min(1, recommendationScore)) : null,
      userDna: computedDna,
      matchScores: matchScores || null,
      timestamp: new Date(),
    };

    let docId;
    try {
      const interactionDoc = await Interaction.create(docPayload);
      docId = interactionDoc._id;
    } catch (err) {
      const mongooseConn = await dbConnect();
      const result = await mongooseConn.connection.db.collection('hi_pando_interactions').insertOne(docPayload);
      docId = result.insertedId;
    }

    return NextResponse.json({ success: true, id: docId });
  } catch (error) {
    console.error('Interaction Logging Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record interaction' }, { status: 500 });
  }
}


export async function GET() {
  try {
    await dbConnect();
    const logs = await Interaction.find({}).sort({ timestamp: -1 }).limit(50).lean();
    return NextResponse.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error('Interaction Fetch Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch interactions' }, { status: 500 });
  }
}


