import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true,
  },

  issueDate: {
    type: Date,
    required: true,
  },

  dueDate: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ["sent", "paid", "overdue"],
    default: "sent",
  },

  sentAt: {
    type: Date,
    required: true,
  },

  paidAt: {
    type: Date,
  },

  // Currency is now fixed → no enum, no flexibility
  currency: {
    type: String,
    default: "USD",
    required: true,
  },

  // PayPal fields
  paypalOrderId: String,
  paypalCaptureId: String,

  client: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
  },

  items: [
    {
      description: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 },
    },
  ],

  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },

  notes: {
    type: String,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Invoice", invoiceSchema);