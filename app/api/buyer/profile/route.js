import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Buyer from '@/lib/models/Buyer';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'hi-pando-super-secret-jwt-key-change-in-prod';

async function getUserFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function GET() {
  try {
    const decoded = await getUserFromToken();
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const buyer = await Buyer.findById(decoded.userId).select('purchasingGoal budgetRange preferredTypology preferredLocations name email phoneNumber');
    
    if (!buyer) {
      return NextResponse.json({ success: false, error: 'Buyer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: buyer });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const decoded = await getUserFromToken();
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { purchasingGoal, budgetRange, preferredTypology, preferredLocations } = await req.json();

    await dbConnect();
    
    const updateData = {};
    if (purchasingGoal !== undefined) updateData.purchasingGoal = purchasingGoal;
    if (budgetRange !== undefined) updateData.budgetRange = budgetRange;
    if (preferredTypology !== undefined) updateData.preferredTypology = preferredTypology;
    if (preferredLocations !== undefined) updateData.preferredLocations = preferredLocations;

    const buyer = await Buyer.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    ).select('purchasingGoal budgetRange preferredTypology preferredLocations');

    if (!buyer) {
      return NextResponse.json({ success: false, error: 'Buyer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: buyer });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
