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
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev-mode');
    const { payload } = await jwtVerify(token, secret);
    return payload.userId;
  } catch (err) {
    return null;
  }
}

// GET: Fetch recent 4 history items for current buyer
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: true, authenticated: false, history: [] });
    }

    await dbConnect();
    const buyer = await Buyer.findById(userId);
    if (!buyer) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Sort by viewedAt desc and slice top 4
    const historyList = (buyer.history || [])
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 4)
      .map((item) => ({
        propertyId: item.propertyId,
        title: item.title,
        location: item.location,
        price: item.price,
        image: item.image,
        viewedAt: item.viewedAt,
      }));

    return NextResponse.json({ success: true, authenticated: true, history: historyList });
  } catch (error) {
    console.error('History GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch history' }, { status: 500 });
  }
}

// POST: Add a property view or query to history
export async function POST(req) {
  try {
    const body = await req.json();
    const { propertyId, title, location, price, image } = body;
    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Missing propertyId' }, { status: 400 });
    }

    const userId = await getUserId();
    if (!userId) {
      // Unauthenticated users rely on frontend localStorage cache
      return NextResponse.json({ success: true, authenticated: false, message: 'Saved locally' });
    }

    await dbConnect();
    const buyer = await Buyer.findById(userId);
    if (!buyer) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!buyer.history) {
      buyer.history = [];
    }

    // Remove existing entry for same propertyId to avoid duplicates
    buyer.history = buyer.history.filter((h) => h.propertyId !== propertyId);

    // Push new entry to top
    buyer.history.unshift({
      propertyId,
      title: title || 'Property',
      location: location || '',
      price: price || 0,
      image: image || '',
      viewedAt: new Date(),
    });

    // Cap history length at 10 items
    if (buyer.history.length > 10) {
      buyer.history = buyer.history.slice(0, 10);
    }

    await buyer.save();

    const updatedHistory = buyer.history.slice(0, 4).map((item) => ({
      propertyId: item.propertyId,
      title: item.title,
      location: item.location,
      price: item.price,
      image: item.image,
      viewedAt: item.viewedAt,
    }));

    return NextResponse.json({ success: true, authenticated: true, history: updatedHistory });
  } catch (error) {
    console.error('History POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record history' }, { status: 500 });
  }
}
