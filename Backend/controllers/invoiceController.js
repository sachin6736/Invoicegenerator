import Invoice from '../Models/Invoice.js';
import { Resend } from 'resend';


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

    // 1. Validate required fields
    if (!data.client?.email) {
      return res.status(400).json({ success: false, message: 'Client email is required' });
    }

    if (!data.totalAmount || data.totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid total amount is required' });
    }

    // 2. Determine next invoice number
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

    // 3. Create the final invoice directly
    const invoice = new Invoice({
      ...data,
      invoiceNumber,
      issueDate: new Date(),
      sentAt: new Date(),
      status: 'sent',
    });

    await invoice.save();
    console.log(`Invoice created and marked sent: ${invoiceNumber}`);

    // 4. Send email
    const resend = getResend();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #1e40af;">Invoice ${invoiceNumber}</h2>
        <p>Dear ${data.client.name},</p>
        <p>Thank you for your business. Here is your invoice:</p>
        <!-- Add your invoice items table / details here -->
        <p style="font-weight: bold; text-align: right; font-size: 1.3rem;">
          Total: ₹${invoice.totalAmount.toFixed(2)}
        </p>
        ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
        <p>Thank you,<br>Your Company Name</p>
      </div>
    `;

    const { data: emailData, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // ← change to your verified domain later
      to: data.client.email,
      subject: `Invoice ${invoiceNumber} from Your Company`,
      html: htmlContent,
      text: `Invoice ${invoiceNumber} from Your Company\n\nDear ${data.client.name},\n\nTotal: ₹${invoice.totalAmount.toFixed(2)}\n\nThank you!`,
    });

    if (error) {
      console.error('Email sending failed:', error);

      // Optional: delete the invoice if email critically fails
      // (you may want to keep it and mark as "send failed" instead)
      await Invoice.findByIdAndDelete(invoice._id);
      console.log(`Removed invoice due to email failure: ${invoiceNumber}`);

      throw new Error(error.message || 'Failed to send email');
    }

    // Success
    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully',
      invoice,
      emailId: emailData?.id,
    });
  } catch (error) {
    console.error('Send invoice error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to send invoice',
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
      .select('invoiceNumber client.name client.email issueDate sentAt totalAmount status')
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