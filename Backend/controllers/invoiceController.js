import Invoice from '../Models/Invoice.js';
import { Resend } from 'resend';

// Do NOT create Resend here at top-level
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


export const createdraft = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Draft saved successfully',
      invoice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving draft',
      error: error.message,
    });
  }
};


export const sendInvoice = async (req, res) => {
  try {
    const data = req.body;

    // 1. Validate required fields (extra safety)
    if (!data.client?.email) {
      return res.status(400).json({ success: false, message: 'Client email is required' });
    }

    // 2. Create draft invoice FIRST (without number, status 'draft')
    const draftInvoice = new Invoice({
      ...data,
      issueDate: new Date(),
      status: 'draft',
      // invoiceNumber: still undefined
    });

    await draftInvoice.save();
    console.log(`Temporary draft created: ${draftInvoice._id}`);

    // 3. Send email
    const resend = getResend();

    // Prepare HTML (use draftInvoice._id if needed, but no number yet)
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #1e40af;">Invoice (pending number)</h2>
        <p>Dear ${data.client.name},</p>
        <p>Thank you for your business. Here is your invoice:</p>
        <!-- rest of your table and content -->
        <p style="font-weight: bold; text-align: right; font-size: 1.3rem;">
          Total: ₹${draftInvoice.totalAmount.toFixed(2)}
        </p>
        ${draftInvoice.notes ? `<p><strong>Notes:</strong> ${draftInvoice.notes}</p>` : ''}
        <p>Thank you,<br>Your Company Name</p>
      </div>
    `;

    const { data: emailData, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: data.client.email,
      subject: `Invoice from Your Company`,
      html: htmlContent,
      text: `Invoice from Your Company\n\nDear ${data.client.name},\n\nTotal: ₹${draftInvoice.totalAmount.toFixed(2)}\n\nThank you!`,
    });

    if (error) {
      console.error('Email failed:', error);
      // Delete the temporary draft since email failed
      await Invoice.findByIdAndDelete(draftInvoice._id);
      throw new Error(error.message || 'Failed to send email');
    }

    // 4. Email succeeded → NOW generate number and finalize
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

    // Final update: assign number, set sent status
    const finalInvoice = await Invoice.findByIdAndUpdate(
      draftInvoice._id,
      {
        invoiceNumber,
        sentAt: new Date(),
        status: 'sent',
        issueDate: new Date(),
      },
      { new: true }
    );

    console.log(`Invoice finalized: ${invoiceNumber}`);

    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully',
      invoice: finalInvoice,
      emailId: emailData?.id,
    });
  } catch (error) {
    console.error('Send invoice error:', error);

    // If something failed after draft save, try to clean up
    if (draftInvoice && draftInvoice._id) {
      try {
        await Invoice.findByIdAndDelete(draftInvoice._id);
        console.log(`Cleaned up failed draft: ${draftInvoice._id}`);
      } catch (cleanupErr) {
        console.error('Cleanup failed:', cleanupErr);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send invoice',
      error: error.message,
    });
  }
};

export const getSentInvoices = async (req, res) => {
  try {
    // Get query params (with defaults)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Only sent & paid invoices
    const query = { status: { $in: ['sent', 'paid'] } };

    // Get total count for pagination info
    const total = await Invoice.countDocuments(query);

    // Fetch paginated results
    const invoices = await Invoice.find(query)
      .sort({ sentAt: -1 }) // newest sent first
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