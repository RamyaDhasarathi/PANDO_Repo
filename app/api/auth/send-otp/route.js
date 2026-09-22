import { NextResponse } from 'next/server';
import twilio from 'twilio';
import dbConnect from '../../../../lib/mongodb';
import Buyer from '../../../../lib/models/Buyer';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req) {
  try {
    const { contact, isEmail, phoneNumber, isSignUp } = await req.json();
    const target = contact || phoneNumber;

    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Contact detail is required' },
        { status: 400 }
      );
    }

    // Fail early cross-verification
    await dbConnect();
    const query = isEmail ? { email: target } : { phoneNumber: target };
    const existingUser = await Buyer.findOne(query);

    if (isSignUp && existingUser) {
      return NextResponse.json(
        { success: false, error: 'Account already exists. Please sign in.' },
        { status: 400 }
      );
    }

    if (!isSignUp && !existingUser) {
      return NextResponse.json(
        { success: false, error: 'Account not found. Please create an account.' },
        { status: 400 }
      );
    }

    const channel = isEmail ? 'email' : 'sms';

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: target, channel });

    return NextResponse.json({ success: true, sid: verification.sid });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
