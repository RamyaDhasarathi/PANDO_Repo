import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '../../../../lib/mongodb';
import Buyer from '../../../../lib/models/Buyer';

export const dynamic = 'force-dynamic';

async function getUserId() {
  const token = cookies().get('auth_token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'hi-pando-super-secret-jwt-key-change-in-prod');
    const { payload } = await jwtVerify(token, secret);
    return payload.userId;
  } catch (err) {
    return null;
  }
}

// GET: Fetch property-specific history or recent buyer history
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: true, authenticated: false, history: [] });
    }

    await dbConnect();
    const buyer = await Buyer.findById(userId);
    if (!buyer) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let historyList = buyer.history || [];

    if (propertyId) {
      historyList = historyList.filter((item) => item.propertyId === propertyId);
    }

    historyList = historyList
      .sort((a, b) => new Date(b.viewedAt || b.timestamp) - new Date(a.viewedAt || a.timestamp))
      .slice(0, 10)
      .map((item) => ({
        propertyId: item.propertyId,
        query: item.query || item.title,
        answer: item.answer || item.location || '',
        price: item.price,
        image: item.image,
        timestamp: item.viewedAt || item.timestamp,
      }));

    return NextResponse.json({ success: true, authenticated: true, history: historyList });
  } catch (error) {
    console.error('History GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch history' }, { status: 500 });
  }
}

// POST: Add a property-specific interaction/query to history
export async function POST(req) {
  try {
    const body = await req.json();
    const { propertyId, query, answer, title, location, price, image } = body;
    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Missing propertyId' }, { status: 400 });
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: true, authenticated: false, message: 'Saved locally' });
    }

    await dbConnect();

    const itemQuery = query || title || 'Property Inquiry';
    const itemAnswer = answer || location || '';

    // First remove any exact duplicate query item for the same propertyId atomically
    await Buyer.findByIdAndUpdate(userId, {
      $pull: {
        history: { propertyId, title: itemQuery }
      }
    });

    // Then push new item to beginning of array atomically without versioning error
    await Buyer.findByIdAndUpdate(userId, {
      $push: {
        history: {
          $each: [{
            propertyId,
            title: itemQuery,
            location: itemAnswer,
            price: price || 0,
            image: image || '',
            viewedAt: new Date(),
          }],
          $position: 0,
          $slice: 30
        }
      }
    });

    return NextResponse.json({ success: true, authenticated: true });
  } catch (error) {
    console.error('History POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record history' }, { status: 500 });
  }
}


