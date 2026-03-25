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

  currency: {
    type: String,
    default: "USD",
    required: true,
  },

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

  // Single note (for general use)
  notes: {
    type: String,
  },

  // Notes History - only for paid invoices (as per your request)
  notesHistory: [
    {
      note: { type: String, required: true },
      addedAt: { type: Date, default: Date.now },
    }
  ],

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