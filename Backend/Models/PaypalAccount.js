import mongoose from 'mongoose';

const paypalAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountName: {
    type: String,
    required: true,
    trim: true,
  },
  clientId: {
    type: String,
    required: true,
  },
  secretKey: {
    type: String,
    required: true,
  },
  isSandbox: {
    type: Boolean,
    default: false,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('PaypalAccount', paypalAccountSchema);