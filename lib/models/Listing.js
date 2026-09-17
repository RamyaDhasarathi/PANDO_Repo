import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema({
  originalId: { type: String, unique: true },
  title: String,
  description: String,
  
  // Categorization
  purpose: String, // 'sale' or 'rent'
  propertyType: String, // 'Apartment', 'Villa', 'Townhouse', 'Plot'
  category: String, // 'Apartments', 'Villas', 'Off-Plan', 'Penthouses', 'Townhouses'
  
  // Source Separation
  source: { 
    type: String, 
    enum: ['broker', 'developer'],
    default: 'broker'
  },
  listedBy: String, 
  
  // Pricing & Specs
  price: Number,
  bedrooms: Number,
  bathrooms: Number,
  areaSqft: Number,
  furnishing: String, // 'Furnished', 'Semi-Furnished', 'Unfurnished'
  
  // Location
  community: String,
  city: { type: String, default: "Dubai" },
  coordinates: {
    lat: Number,
    lng: Number
  },
  
  // Media & Features
  images: [String],
  amenities: [String],
  
  // Optional AI Metrics
  aiScore: Number,
  yield: Number,
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Listing || mongoose.model('Listing', ListingSchema, 'listings');
