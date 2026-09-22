import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '../../../../lib/mongodb';
import Buyer from '../../../../lib/models/Buyer';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = cookies().get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    
    // Verify the JWT token
    const { payload } = await jwtVerify(token, secret);

    // Connect to DB and fetch user
    await dbConnect();
    const user = await Buyer.findById(payload.userId).select('-__v');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Auth Me Error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
