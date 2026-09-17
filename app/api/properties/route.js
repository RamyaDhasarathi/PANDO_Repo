import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Listing from '../../../lib/models/Listing';

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

    // 1. Text Search Query
    if (q) {
      const regex = new RegExp(q, 'i');
      query.$or = [
        { title: regex },
        { community: regex },
        { propertyType: regex },
        { category: regex },
        { description: regex }
      ];
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
        image: obj.images && obj.images.length > 0 ? obj.images[0] : null
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Properties API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch properties' }, { status: 500 });
  }
}
