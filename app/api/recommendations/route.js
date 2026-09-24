import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Listing from '@/lib/models/Listing';
import { PROPERTIES_DATA } from '@/data/quantumProperties';
import { extractUserDNA, createUserDNA, generateRecommendations } from '@/lib/buyerDna';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userDna: rawUserDna, conversationText, topN = 10 } = body;

    // Validate input: exactly one of userDna or conversationText must be provided
    if ((!rawUserDna && !conversationText) || (rawUserDna && conversationText)) {
      return NextResponse.json(
        { success: false, error: 'Provide exactly one of userDna or conversationText' },
        { status: 400 }
      );
    }

    let userDna;
    if (rawUserDna) {
      userDna = createUserDNA(rawUserDna);
    } else {
      userDna = extractUserDNA(conversationText);
    }

    // Load property listings from DB or static fallback
    let properties = [];
    try {
      await dbConnect();
      const docs = await Listing.find({}).lean().exec();
      if (docs && docs.length > 0) {
        properties = docs.map((doc) => ({
          ...doc,
          id: doc._id.toString(),
          property_id: doc._id.toString(),
          location: doc.community || doc.city || 'Dubai',
          property_type: doc.propertyType || doc.category || 'Apartment',
          listing_purpose: doc.purpose === 'rent' ? 'Rent' : 'Sale',
          rental_yield: doc.yield || null,
        }));
      }
    } catch (dbError) {
      console.warn('MongoDB connection unavailable, using fallback properties:', dbError.message);
    }

    if (properties.length === 0 && Array.isArray(PROPERTIES_DATA) && PROPERTIES_DATA.length > 0) {
      properties = PROPERTIES_DATA.map((p) => ({
        ...p,
        property_id: String(p.id),
        location: p.community || p.location || 'Dubai',
        property_type: p.propertyType || p.type || 'Apartment',
        listing_purpose: 'Sale',
        rental_yield: p.yield || null,
      }));
    }

    if (properties.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No property data available for recommendations' },
        { status: 503 }
      );
    }

    const recommendations = generateRecommendations(userDna, properties, topN);

    return NextResponse.json({
      success: true,
      user_dna: userDna,
      recommendations,
    });
  } catch (error) {
    console.error('Buyer DNA Recommendations API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing recommendations' },
      { status: 500 }
    );
  }
}
