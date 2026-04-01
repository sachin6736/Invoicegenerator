// controllers/paypalController.js
import paypal from '@paypal/checkout-server-sdk';
import Invoice from '../Models/Invoice.js';
import PaypalAccount from '../Models/PaypalAccount.js';

// Helper function to get PayPal client for the current user
const getPayPalClient = async (userId) => {
  // Find the user's default PayPal account
  const account = await PaypalAccount.findOne({ 
    userId, 
    isDefault: true 
  });

  if (!account) {
    throw new Error('No default PayPal account found. Please set one in Settings.');
  }

  const environment = account.isSandbox
    ? new paypal.core.SandboxEnvironment(account.clientId, account.secretKey)
    : new paypal.core.LiveEnvironment(account.clientId, account.secretKey);

  return new paypal.core.PayPalHttpClient(environment);
};

// Create PayPal Order
export const createPayPalOrder = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const userId = req.userId;   // from authMiddleware

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice already paid' });
    }

    // Get PayPal client using user's default account
    const client = await getPayPalClient(userId);

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        invoice_id: invoice.invoiceNumber,
        amount: {
          currency_code: invoice.currency || 'USD',
          value: invoice.totalAmount.toFixed(2),
        },
        description: `Invoice ${invoice.invoiceNumber}`,
      }],
    });

    const response = await client.execute(request);

    // Save PayPal Order ID
    invoice.paypalOrderId = response.result.id;
    await invoice.save();

    res.json({ 
      success: true, 
      orderId: response.result.id 
    });

  } catch (err) {
    console.error('Create PayPal Order Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to create PayPal order' 
    });
  }
};

// Capture PayPal Order
export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    // Get PayPal client
    const client = await getPayPalClient(userId);

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
    console.error('Capture PayPal Order Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Payment capture failed' 
    });
  }
};