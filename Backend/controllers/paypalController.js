import paypal from '@paypal/checkout-server-sdk';
import Invoice from '../Models/Invoice.js';

const environment = process.env.PAYPAL_MODE === 'live'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

const client = new paypal.core.PayPalHttpClient(environment);

// Create PayPal order
export const createPayPalOrder = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice already paid' });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        invoice_id: invoice.invoiceNumber,
        amount: {
          currency_code: invoice.currency,
          value: invoice.totalAmount.toFixed(2),
        },
        description: `Invoice ${invoice.invoiceNumber} - First Used Auto Parts`,
      }],
    });

    const response = await client.execute(request);

    invoice.paypalOrderId = response.result.id;
    await invoice.save();

    res.json({ success: true, orderId: response.result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create PayPal order' });
  }
};

// Capture payment
export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    const response = await client.execute(request);

    const capture = response.result.purchase_units[0].payments.captures[0];

    const invoice = await Invoice.findOneAndUpdate(
      { paypalOrderId: orderId },
      {
        status: 'paid',
        paidAt: new Date(),
        paypalCaptureId: capture.id,
      },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, invoice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Payment capture failed' });
  }
};