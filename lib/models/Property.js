import mongoose from 'mongoose';

const PropertySchema = new mongoose.Schema({
  originalId: {
    type: String,
    unique: true,
  },
  name: String,
  location: String,
  propertyType: String,
  category: String,
  bedrooms: Number,
  bathrooms: Number,
  area: Number,
  price: Number,
  priceUsd: Number,
  yield: Number,
  aiScore: Number,
  indexLabel: String,
  sectorBadge: String,
  statusBadge: {
    label: String,
    variant: String,
  },
  image: String,
  tags: [String],
  description: String,
  amenities: [String],
  investmentInsight: String,
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.Property || mongoose.model('Property', PropertySchema, 'properties');
