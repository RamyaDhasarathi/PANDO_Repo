import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Property from '../../../../lib/models/Property';
import { PROPERTIES_DATA } from '../../../../data/quantumProperties';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    // Check if already seeded
    const count = await Property.countDocuments();
    if (count > 0) {
      return NextResponse.json({ success: true, message: 'Database already seeded', count });
    }

    // Map and insert data
    const propertiesToInsert = PROPERTIES_DATA.map(p => ({
      ...p,
      originalId: p.id,
      id: undefined // Remove local id so Mongo generates _id
    }));

    await Property.insertMany(propertiesToInsert);

    return NextResponse.json({ success: true, message: 'Database seeded successfully', count: propertiesToInsert.length });
  } catch (error) {
    console.error('Seeding Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
