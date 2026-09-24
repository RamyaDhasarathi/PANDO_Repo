import mongoose from 'mongoose';

const InteractionSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'GUEST_USER',
  },
  propertyId: {
    type: String,
    default: 'PROPERTIES_ALL',
  },
  event: {
    type: String,
    enum: [
      'PROPERTY_SHOWN',
      'PROPERTY_CLICKED',
      'PROPERTY_VIEWED',
      'PROPERTY_SAVED',
      'PROPERTY_SHORTLISTED',
      'PROPERTY_REJECTED',
      'BROKER_CONTACTED',
      'VIEWING_REQUESTED'
    ],
    default: 'PROPERTY_VIEWED',
  },
  query: {
    type: String,
    default: '',
  },
  reply: {
    type: String,
    default: '',
  },
  recommendationScore: {
    type: Number,
    default: null,
  },
  userDna: {
    type: Object,
    default: null,
  },
  matchScores: {
    type: Object,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { strict: false });

export default mongoose.models.Interaction || mongoose.model('Interaction', InteractionSchema, 'hi_pando_interactions');


