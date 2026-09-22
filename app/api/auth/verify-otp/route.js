import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { SignJWT } from 'jose';
import dbConnect from '../../../../lib/mongodb';
import Buyer from '../../../../lib/models/Buyer';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

export async function POST(req) {
  try {
    const { contact, isEmail, phoneNumber, code, name, devMode, isSignUp } = await req.json();
    const target = contact || phoneNumber;

    if (!target || !code) {
      return NextResponse.json(
        { success: false, error: 'Contact detail and code are required' },
        { status: 400 }
      );
    }

    // 1. Check code with Twilio (skip if devMode is enabled or Twilio client is not configured)
    const client = getTwilioClient();
    if (!devMode && client) {
      const check = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: target, code: code });

      if (check.status !== 'approved') {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired OTP' },
          { status: 400 }
        );
      }
    }

    // 2. Code is approved, sync with DB
    await dbConnect();
    
    // Find buyer by either phone or email
    const query = isEmail ? { email: target } : { phoneNumber: target };
    
    let user = await Buyer.findOne(query);
    let isNewUser = false;
    
    if (isSignUp) {
      if (user) {
        return NextResponse.json(
          { success: false, error: 'Account already exists. Please sign in.' },
          { status: 400 }
        );
      }
      user = await Buyer.create({ ...query, name: name || '' });
      isNewUser = true;
    } else {
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Account not found. Please create an account.' },
          { status: 400 }
        );
      }
    }

    // 3. Create JWT Session
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev-mode');
    const alg = 'HS256';

    const jwt = await new SignJWT({ userId: user._id.toString(), role: user.role })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 days session
      .sign(secret);

    // 4. Set HttpOnly Cookie
    cookies().set('auth_token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });

    return NextResponse.json({ 
      success: true, 
      user: { id: user._id.toString(), contact: target, name: user.name },
      isNewUser
    });
    
  } catch (error) {
    console.error('Verify OTP Error:', error);
    
    // Twilio returns a 404 if the phone number wasn't sent an OTP recently (or it expired)
    if (error.status === 404) {
      return NextResponse.json(
        { success: false, error: 'OTP session expired or invalid contact details. Please go back and try sending a new code.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
