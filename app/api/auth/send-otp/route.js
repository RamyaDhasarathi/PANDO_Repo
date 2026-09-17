import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req) {
  try {
    const { contact, isEmail, phoneNumber } = await req.json();
    const target = contact || phoneNumber;

    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Contact detail is required' },
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
