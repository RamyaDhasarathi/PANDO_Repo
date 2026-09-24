import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Listing from '../../../lib/models/Listing';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q') || '';
    const location = searchParams.get('location') || 'all';
    const type = searchParams.get('type') || 'all';
    const priceRange = searchParams.get('priceRange') || 'all';
    const sort = searchParams.get('sort') || 'ai-recommended';

    let query = {};

    // 1. Natural Language Parsing (NLP) for Query
    if (q) {
      let remainingText = q;

      // Extract Area (e.g. 1600 sqft, 200 sq feet, 1500 sqm)
      const areaMatch = remainingText.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(sqft|sq\s*feet|sq\s*ft|sqm|sq\s*m)/i);
      if (areaMatch) {
        const areaVal = parseFloat(areaMatch[1].replace(/,/g, ''));
        // 15% range for area search
        query.areaSqft = { $gte: areaVal * 0.85, $lte: areaVal * 1.15 };
        remainingText = remainingText.replace(areaMatch[0], '');
      }

      // Extract Bedrooms (e.g. 4 beds, 3 bedroom, 2 bhk)
      const bedMatch = remainingText.match(/(\d+)\s*(bed|beds|bedroom|bedrooms|bhk)/i);
      if (bedMatch) {
        const beds = parseInt(bedMatch[1], 10);
        query.bedrooms = beds;
        remainingText = remainingText.replace(bedMatch[0], '');
      }

      // Extract Price (e.g. 5m, 200k, 500000 aed)
      const priceMatch = remainingText.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(m|million|k|aed|dirham)/i);
      if (priceMatch) {
        let priceVal = parseFloat(priceMatch[1].replace(/,/g, ''));
        const unit = priceMatch[2].toLowerCase();
        
        if (unit.startsWith('m')) priceVal *= 1000000;
        else if (unit === 'k') priceVal *= 1000;
        
        // 20% range for price search
        query.price = { ...query.price, $gte: priceVal * 0.8, $lte: priceVal * 1.2 };
        remainingText = remainingText.replace(priceMatch[0], '');
      }

      // Clean up remaining text and apply standard regex search
      remainingText = remainingText.trim().replace(/\s+/g, ' ');
      if (remainingText.length > 1) {
        const regex = new RegExp(remainingText, 'i');
        query.$or = [
          { title: regex },
          { community: regex },
          { propertyType: regex },
          { category: regex },
          { description: regex }
        ];
      }
    }

    // 2. Location Filtering
    if (location !== 'all') {
      if (location === 'waterfront') {
        const waterfrontQuery = {
          $or: [
            { category: 'Waterfront' },
            { category: 'Skyline' },
            { title: /Palm/i },
            { title: /Marina/i },
            { community: /Marina/i },
            { community: /Palm/i }
          ]
        };
        if (query.$or) {
          query = { $and: [ { $or: query.$or }, waterfrontQuery ] };
        } else {
          query = waterfrontQuery;
        }
      } else {
        query.community = new RegExp(location, 'i');
      }
    }

    // 3. Property Type Filtering
    if (type !== 'all') {
      query.propertyType = new RegExp(type, 'i');
    }

    // 4. Price Filtering
    if (priceRange !== 'all') {
      if (priceRange === 'under-50m') {
        query.price = { $lt: 50000000 };
      } else if (priceRange === '50m-80m') {
        query.price = { $gte: 50000000, $lte: 80000000 };
      } else if (priceRange === '80m-plus') {
        query.price = { $gt: 80000000 };
      }
    }

    // Fetch matching properties
    let propertiesQuery = Listing.find(query);

    // 5. Sorting
    switch (sort) {
      case 'price-asc':
        propertiesQuery = propertiesQuery.sort({ price: 1 });
        break;
      case 'price-desc':
        propertiesQuery = propertiesQuery.sort({ price: -1 });
        break;
      case 'yield':
        propertiesQuery = propertiesQuery.sort({ yield: -1 });
        break;
      case 'ai-recommended':
      default:
        propertiesQuery = propertiesQuery.sort({ aiScore: -1 });
        break;
    }

    const properties = await propertiesQuery.exec();

    // Format response and map fields back to what SearchResults expects
    const formatted = properties.map(p => {
      const obj = p.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        name: obj.title, // SearchResults expects 'name' for toasts
        location: obj.community,
        image: obj.images && obj.images.length > 0 ? obj.images[0] : null,
        // Expose coordinates explicitly so the map can use them
        coordinates: obj.coordinates || null,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Properties API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch properties' }, { status: 500 });
  }
}
