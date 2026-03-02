import mongoose from "mongoose";

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

  // 👇 Invoice lifecycle
  status: {
    type: String,
    enum: ["draft", "sent", "paid"],
    default: "draft",
  },

  // 👇 Track when email was sent
  sentAt: {
    type: Date,
  },

  // 👇 Track payment time
  paidAt: {
    type: Date,
  },

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

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;