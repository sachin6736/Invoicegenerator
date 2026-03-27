import Invoice from '../Models/Invoice.js';
import { Resend } from 'resend';
import { generateInvoicePDF } from '../utils/generateInvoicePDF.js';


// Do NOT create Resend at top-level
let resendInstance = null;

function getResend() {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is missing in environment variables');
    }
    console.log('Initializing Resend with key:', process.env.RESEND_API_KEY.slice(0, 6) + '...');
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}
export const sendInvoice = async (req, res) => {
  try {
    const data = req.body;

    // 1. Validation
    if (!data.client?.email) {
      return res.status(400).json({ success: false, message: 'Client email is required' });
    }
    if (!data.totalAmount || data.totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid total amount is required' });
    }

    const currency = 'USD';

    // Generate Invoice Number
    const lastInvoice = await Invoice.findOne({ invoiceNumber: { $ne: null } })
      .sort({ invoiceNumber: -1 })
      .select('invoiceNumber')
      .lean();

    let nextNum = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const numPart = parseInt(lastInvoice.invoiceNumber.replace('INV-', ''), 10);
      if (!isNaN(numPart)) nextNum = numPart + 1;
    }
    const invoiceNumber = `INV-${String(nextNum).padStart(4, '0')}`;

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setHours(dueDate.getHours() + 48);

    // Save Invoice
    const invoice = new Invoice({
      ...data,
      invoiceNumber,
      issueDate,
      dueDate,
      sentAt: new Date(),
      status: 'sent',
      currency,
    });

    await invoice.save();
    console.log(`Invoice created: ${invoiceNumber}`);

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Convert to base64
    const pdfBase64 = pdfBuffer.toString('base64');

    res.status(200).json({
      success: true,
      message: 'Invoice created successfully',
      invoice: {
        ...invoice.toObject(),
        dueDate: dueDate.toISOString(),
      },
      pdfBase64,
      pdfFilename: `Invoice-${invoiceNumber}.pdf`
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message,
    });
  }
};
export const getSentInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { status: { $in: ['sent', 'paid'] } };

    const total = await Invoice.countDocuments(query);

    const invoices = await Invoice.find(query)
      .sort({ sentAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .select(
        'invoiceNumber client.name client.email issueDate sentAt totalAmount status dueDate'
      ) // ← added dueDate
      .lean();

    res.status(200).json({
      success: true,
      invoices,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Fetch sent invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message,
    });
  }
};

// ... existing imports and exports ...

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id).lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Get invoice by ID error:', error);
    res.status(500).json({  
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message,
    });
  }
};

export const getPaidInvoices = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const query = { status: "paid" };

    const total = await Invoice.countDocuments(query);

    const invoices = await Invoice.find(query)
      .sort({ paidAt: -1 })           // most recently paid first
      .skip(skip)
      .limit(limit)
      .select(
        'invoiceNumber client.name client.email issueDate sentAt paidAt totalAmount status dueDate'
      )
      .lean();

    res.status(200).json({
      success: true,
      invoices,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Fetch paid invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch paid invoices',
      error: error.message,
    });
  }
};


// controllers/invoiceController.js
export const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note cannot be empty' });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      {
        $push: {
          notesHistory: {
            note: note.trim(),
            addedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Note added to history successfully',
      invoice,
    });
  } catch (error) {
    console.error("Add note error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

