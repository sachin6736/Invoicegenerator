import mongoose from 'mongoose';

// models/Invoice.js
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {           // ← NEW FIELD
    type: Date,
    // You can leave it without default — we'll set it in the controller
  },
  status: {
    type: String,
    enum: ["draft", "sent", "paid", "overdue"], // ← optionally add "overdue" later
    default: "draft",
  },
  sentAt: {
    type: Date,
  },
  paidAt: {
    type: Date,
  },
  client: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String }, // still exists in model — frontend just doesn't send it anymore
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

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;