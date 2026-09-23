import mongoose from 'mongoose';

const BuyerSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    sparse: true, // sparse index allows nulls/undefined but enforces uniqueness for actual values
    unique: true,
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
  },
  name: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['buyer', 'admin'],
    default: 'buyer',
  },
  favorites: [{
    type: String, // Property IDs
  }],
  history: [{
    propertyId: { type: String, required: true },
    title: { type: String, default: '' },
    location: { type: String, default: '' },
    price: { type: Number, default: 0 },
    image: { type: String, default: '' },
    viewedAt: { type: Date, default: Date.now }
  }],
  // AI Personalization Preferences
  purchasingGoal: {
    type: String,
    enum: ['End-User', 'Investor', ''],
    default: '',
  },
  budgetRange: {
    type: String,
    default: '',
  },
  preferredTypology: {
    type: String,
    default: '',
  },
  preferredLocations: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});



// explicitly set collection name to 'buyers'
export default mongoose.models.Buyer || mongoose.model('Buyer', BuyerSchema, 'buyers');
