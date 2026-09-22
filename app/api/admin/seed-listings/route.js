import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Listing from '@/lib/models/Listing';
import { properties as rawDatasetProperties } from '@/data/properties';

// COMMUNITY_COORDS mapping from PandoMapExplore for accurate coordinates
const COMMUNITY_COORDS = {
  'Dubai Marina': { lat: 25.0772, lng: 55.1332 },
  'Downtown Dubai': { lat: 25.1972, lng: 55.2744 },
  'Palm Jumeirah': { lat: 25.1124, lng: 55.1390 },
  'Arabian Ranches': { lat: 25.0450, lng: 55.2750 },
  'Dubai Hills Estate': { lat: 25.1165, lng: 55.2505 },
  'Business Bay': { lat: 25.1852, lng: 55.2631 },
  'JVC': { lat: 25.0600, lng: 55.2080 },
  'Jumeirah': { lat: 25.1412, lng: 55.1852 },
  'Emirates Hills': { lat: 25.0680, lng: 55.1780 },
  'Dubai Creek Harbour': { lat: 25.1895, lng: 55.3370 },
  'Port de La Mer': { lat: 25.2340, lng: 55.2630 },
  'Water Canal': { lat: 25.1820, lng: 55.2500 },
};

export async function GET() {
  try {
    await dbConnect();

    // 1. Clear existing listings collection
    await Listing.deleteMany({});

    // 2. Prepare the data from properties.js
    const transformedListings = rawDatasetProperties.map((p, index) => {
      const baseCoords = COMMUNITY_COORDS[p.community] || { lat: 25.12, lng: 55.22 };
      const offsetLat = ((index % 5) - 2) * 0.0045;
      const offsetLng = (Math.floor(index / 5) - 2) * 0.0045;

      // Determine Category based on type
      let category = 'Apartments';
      if (p.type === 'Villa' || p.type?.includes('Villa')) category = 'Villas';
      else if (p.type === 'Townhouse') category = 'Townhouses';
      else if (p.type === 'Plot') category = 'Plots';
      else if (p.type === 'Commercial') category = 'Commercial';
      else if (p.type?.includes('Penthouse')) category = 'Penthouses';

      // Decide if it's broker or developer based on property type or random assignment
      let source = 'broker';
      let listedBy = 'Top Tier Real Estate';
      
      if (category === 'Plots' || category === 'Off-Plan' || index % 4 === 0) {
        source = 'developer';
        listedBy = 'Emaar Properties';
      }

      return {
        originalId: p.id,
        title: p.title,
        description: p.description,
        purpose: p.purpose, // 'sale' or 'rent'
        propertyType: p.type,
        category: category,
        source: source,
        listedBy: listedBy,
        price: p.price,
        bedrooms: p.bedrooms || 0,
        bathrooms: p.bathrooms || 0,
        areaSqft: p.areaSqft || 0,
        furnishing: p.furnishing || 'Unfurnished',
        community: p.community,
        city: p.city || 'Dubai',
        coordinates: {
          lat: baseCoords.lat + offsetLat,
          lng: baseCoords.lng + offsetLng
        },
        images: p.images || [],
        amenities: p.amenities || [],
        aiScore: 85 + (Math.random() * 10),
        yield: p.purpose === 'rent' ? (6 + Math.random() * 2) : (4 + Math.random() * 2)
      };
    });

    // 3. Add some explicit new rent and off-plan properties
    const additionalProperties = [
      {
        originalId: 'hp-rent-1',
        title: 'Luxury 3BR Penthouse for Rent in Marina',
        description: 'Breathtaking full sea view penthouse available for immediate rent. Comes fully furnished with designer Italian furniture and private jacuzzi on the balcony.',
        purpose: 'rent',
        propertyType: 'Penthouse',
        category: 'Penthouses',
        source: 'broker',
        listedBy: 'Marina Experts LLC',
        price: 450000,
        bedrooms: 3,
        bathrooms: 4,
        areaSqft: 4200,
        furnishing: 'Furnished',
        community: 'Dubai Marina',
        city: 'Dubai',
        coordinates: { lat: 25.0780, lng: 55.1340 },
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80&auto=format&fit=crop'
        ],
        amenities: ['Private Jacuzzi', 'Full Sea View', 'Maids Room', '2 Parking Spots'],
        aiScore: 92.5,
        yield: 7.2
      },
      {
        originalId: 'hp-offplan-1',
        title: 'Emaar Beachfront Sunrise Bay (Off-Plan)',
        description: 'Brand new off-plan launch by Emaar on the private island of Emaar Beachfront. Flexible 60/40 payment plan with handover in Q4 2027.',
        purpose: 'sale',
        propertyType: 'Apartment',
        category: 'Off-Plan',
        source: 'developer',
        listedBy: 'Emaar Properties',
        price: 3200000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 1450,
        furnishing: 'Unfurnished',
        community: 'Dubai Harbour',
        city: 'Dubai',
        coordinates: { lat: 25.0920, lng: 55.1450 },
        images: [
          'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&auto=format&fit=crop'
        ],
        amenities: ['Private Beach', 'Infinity Pool', 'Payment Plan', 'Gym'],
        aiScore: 95.1,
        yield: 8.5
      },
      {
        originalId: 'hp-offplan-2',
        title: 'Oasis by Emaar - 5BR Ultra Luxury Villa',
        description: 'The newest master community by Emaar. Massive plot size, crystal lagoons, and world-class retail. Handover 2028.',
        purpose: 'sale',
        propertyType: 'Villa',
        category: 'Off-Plan',
        source: 'developer',
        listedBy: 'Emaar Properties',
        price: 15500000,
        bedrooms: 5,
        bathrooms: 6,
        areaSqft: 8500,
        furnishing: 'Unfurnished',
        community: 'The Oasis',
        city: 'Dubai',
        coordinates: { lat: 24.9800, lng: 55.2200 },
        images: [
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80&auto=format&fit=crop'
        ],
        amenities: ['Crystal Lagoon', 'Private Garden', 'Gated Community'],
        aiScore: 98.4,
        yield: 5.5
      }
    ];

    transformedListings.push(...additionalProperties);

    // 4. Insert into the database
    await Listing.insertMany(transformedListings);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${transformedListings.length} broker and developer properties.`,
      count: transformedListings.length
    });
  } catch (error) {
    console.error('Seed Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to seed listings' }, { status: 500 });
  }
}
