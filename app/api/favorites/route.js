import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '../../../lib/mongodb';
import Buyer from '../../../lib/models/Buyer';
import Listing from '../../../lib/models/Listing';

export const dynamic = 'force-dynamic';

// Utility to get current user ID
async function getUserId() {
  const token = cookies().get('auth_token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.userId;
  } catch (err) {
    return null;
  }
}

// GET saved properties for the current user
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const buyer = await Buyer.findById(userId);
    if (!buyer) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const properties = await Listing.find({
      _id: { $in: buyer.favorites }
    });

    const formatted = properties.map(p => {
      const obj = p.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        name: obj.title, // Map title to name for consistency in UI
        image: obj.images?.[0] || null
      };
    });

    return NextResponse.json({ success: true, savedIds: buyer.favorites, properties: formatted });
  } catch (error) {
    console.error('Favorites GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST to toggle a property in favorites
export async function POST(req) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { propertyId } = await req.json();
    if (!propertyId) return NextResponse.json({ success: false, error: 'Missing propertyId' }, { status: 400 });

    await dbConnect();
    const buyer = await Buyer.findById(userId);
    if (!buyer) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const index = buyer.favorites.indexOf(propertyId);
    let isSaved = false;

    if (index > -1) {
      // Remove
      buyer.favorites.splice(index, 1);
    } else {
      // Add
      buyer.favorites.push(propertyId);
      isSaved = true;
    }

    await buyer.save();

    return NextResponse.json({ success: true, isSaved, savedIds: buyer.favorites });
  } catch (error) {
    console.error('Favorites POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
