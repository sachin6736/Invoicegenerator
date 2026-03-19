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

    // 1. Validate required fields
    if (!data.client?.email) {
      return res.status(400).json({ success: false, message: 'Client email is required' });
    }
    if (!data.totalAmount || data.totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid total amount is required' });
    }

    // 2. Currency is fixed to USD
    const currency = 'USD';
    const currencySymbol = '$';

    // 3. Determine next invoice number
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

    // 4. Prepare dates
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setHours(dueDate.getHours() + 48); // 48 hours from now

    // 5. Create and save the invoice
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
    console.log(`Invoice created and marked sent: ${invoiceNumber}`);

    // 6. Prepare email content
    const companyName = 'Auto parts store';
    const amountDue = invoice.totalAmount.toFixed(2);
    const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Build items list for email
    const itemsListHtml = invoice.items
      .map(
        (item) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${currencySymbol}${Number(item.amount).toFixed(2)}</td>
          </tr>
        `
      )
      .join('');

    const itemsListText = invoice.items
      .map((item) => `  • ${item.description}: ${currencySymbol}${Number(item.amount).toFixed(2)}`)
      .join('\n');

    // Real payment link
    const frontendUrls = process.env.FRONTEND_URLS?.split(',') || [];
    const frontendBaseUrl = frontendUrls[0]?.trim() || 'http://localhost:5173';
    const payNowUrl = `${frontendBaseUrl}/pay/${invoice._id}`;

    // HTML email
    const htmlContent = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Invoice from ${companyName}</h2>
        <p style="color: #374151; margin: 0 0 20px;">Dear ${invoice.client.name || 'Customer'},</p>
        
        <p style="color: #374151; margin: 0 0 16px;">
          You have received a new invoice from <strong>${companyName}</strong>.
        </p>

        <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 4px 0;"><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p style="margin: 4px 0;"><strong>Amount Due:</strong> ${currencySymbol}${amountDue}</p>
          <p style="margin: 4px 0;"><strong>Due Date:</strong> ${dueDateFormatted}</p>
        </div>

        <p style="margin: 0 0 12px; font-weight: 600;">Invoice Items:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db;">Description</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>

        <p style="margin: 20px 0 20px; font-weight: bold; text-align: right; font-size: 1.1em;">
          Total Due: ${currencySymbol}${amountDue}
        </p>

        <p style="margin: 0 0 20px;">
          To complete the payment securely, please click the button below:
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${payNowUrl}"
             style="background:#0070ba; color:white; padding:14px 40px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px; display:inline-block; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
            Pay Now
          </a>
        </div>
        
        <p style="color: #374151; margin: 0 0 16px; font-size: 14px;">
          You will be redirected to a secure payment page powered by PayPal.
        </p>
        
        <p style="color: #374151; margin: 0 0 16px;">
          Kindly ensure the payment is completed before the due date. 
          If you have any questions regarding this invoice, please feel free to contact us.
        </p>
        
        <p style="color: #374151; margin: 0;">
          Thank you for your business.<br>
          <strong>${companyName}</strong><br>
        </p>
      </div>
    `;

    // Plain text version
    const textContent = `
Invoice from ${companyName}

Dear ${invoice.client.name || 'Customer'},

You have received a new invoice from ${companyName}.

Invoice Number: ${invoice.invoiceNumber}
Amount Due:    ${currencySymbol}${amountDue}
Due Date:      ${dueDateFormatted}

Invoice Items:
${itemsListText}

Total Due: ${currencySymbol}${amountDue}

To complete the payment, visit this link:
${payNowUrl}

Kindly ensure payment is completed before the due date.
If you have any questions, feel free to contact us.

Thank you for your business!
${companyName}
    `.trim();

    // 7. Send email (no attachment)
    const resend = getResend();

    const { data: emailData, error } = await resend.emails.send({
      from: 'Auto parts store <no-reply@autopartsinvoices.xyz>',
      to: data.client.email,
      subject: `Invoice ${invoiceNumber} from ${companyName}`,
      html: htmlContent,
      text: textContent,
      // attachments: []  ← removed completely
    });

    if (error) {
      console.error('Email sending failed:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    // 8. Success response
    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully',
      invoice: {
        ...invoice.toObject(),
        dueDate: dueDate.toISOString(),
      },
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