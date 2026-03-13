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

    // 2. Determine currency (default USD for US clients)
    const currency = data.currency || 'USD';
    const currencySymbol = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'AED' ? 'د.إ ' : currency;

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
      currency, // ← saved from request (or default USD)
    });

    await invoice.save();
    console.log(`Invoice created and marked sent: ${invoiceNumber}`);

    // 6. Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // 7. Prepare email content
    const companyName = 'First Used Auto Parts';
    const amountDue = invoice.totalAmount.toFixed(2);
    const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // IMPORTANT: Real payment link
const frontendUrls = process.env.FRONTEND_URLS?.split(',') || [];
const frontendBaseUrl = frontendUrls[0]?.trim() || 'http://localhost:5173'; // fallback

const payNowUrl = `${frontendBaseUrl}/pay/${invoice._id}`;

    const htmlContent = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Invoice from ${companyName}</h2>
        <p style="color: #374151; margin: 0 0 20px;">Dear ${invoice.client.name || 'Customer'},</p>
        
        <p style="color: #374151; margin: 0 0 16px;">
          You have received a new invoice from <strong>${companyName}</strong>. 
          Please find the invoice attached with this email for your reference.
        </p>
        
        <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 4px 0;"><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p style="margin: 4px 0;"><strong>Amount Due:</strong> ${currencySymbol}${amountDue}</p>
          <p style="margin: 4px 0;"><strong>Due Date:</strong> ${dueDateFormatted}</p>
        </div>
        
        <p style="margin: 0 0 20px;">
          To complete the payment securely, please click the button below:
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${payNowUrl}"
             style="background:#0070ba; color:white; padding:14px 40px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px; display:inline-block; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
            Pay Now with PayPal
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
          330 N Brand Blvd, STE 700, Glendale, California 91203<br>
          +1 888-282-7476 | contact@firstusedautoparts.com
        </p>
      </div>
    `;

    const textContent = `
Invoice from ${companyName}

Dear ${invoice.client.name || 'Customer'},

You have received a new invoice from ${companyName}.
Please find the invoice attached for your reference.

Invoice Number: ${invoice.invoiceNumber}
Amount Due: ${currencySymbol}${amountDue}
Due Date: ${dueDateFormatted}

To complete the payment, visit this link:
${payNowUrl}

Kindly ensure payment is completed before the due date.
If you have any questions, feel free to contact us.

Thank you for your business!
${companyName}
330 N Brand Blvd, STE 700
Glendale, California 91203
+1 888-282-7476
contact@firstusedautoparts.com
    `.trim();

    // 8. Send email with PDF attachment
    const resend = getResend();

    const { data: emailData, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // ← Replace with your verified domain in production!
      to: data.client.email,
      subject: `Invoice ${invoiceNumber} from ${companyName}`,
      html: htmlContent,
      text: textContent,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: `Invoice_${invoiceNumber}.pdf`,
          contentType: 'application/pdf',
        },
      ],
    });

    if (error) {
      console.error('Email sending failed:', error);
      // Optional: mark invoice as failed instead of deleting
      // await Invoice.findByIdAndUpdate(invoice._id, { status: 'send-failed' });
      throw new Error(error.message || 'Failed to send email with attachment');
    }

    // 9. Success response
    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully with PDF attachment',
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