/// controllers/paypalController.js
import paypal from '@paypal/checkout-server-sdk';
import Invoice from '../Models/Invoice.js';
import PaypalAccount from '../Models/PaypalAccount.js';

// Helper to get PayPal client using user's default account

// Helper to get PayPal client
const getPayPalClient = async (userId) => {
  if (!userId) {
    throw new Error('User not authenticated');
  }

  console.log("🔍 Looking for PayPal account for userId:", userId.toString());

  // Try default account first
  let account = await PaypalAccount.findOne({ 
    userId, 
    isDefault: true 
  });

  if (account) {
    console.log("✅ Using DEFAULT account:", account.accountName);
  } else {
    // Fallback: get any account for this user
    console.log("⚠️ No default account. Trying any account for this user...");
    account = await PaypalAccount.findOne({ userId });
  }

  if (!account) {
    console.log("❌ No PayPal account found for this userId");
    throw new Error('No PayPal account found. Please go to Settings and add + set a default account.');
  }

  console.log(`🚀 Using PayPal Account: ${account.accountName} | Sandbox: ${account.isSandbox} | Default: ${account.isDefault}`);

  const environment = account.isSandbox
    ? new paypal.core.SandboxEnvironment(account.clientId, account.secretKey)
    : new paypal.core.LiveEnvironment(account.clientId, account.secretKey);

  return new paypal.core.PayPalHttpClient(environment);
};

// Create PayPal Order
export const createPayPalOrder = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const userId = req.userId;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice already paid' });
    }

    const client = await getPayPalClient(userId);
    console.log("client",client);
    

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
      message: err.message 
    });
  }
};

// Capture PayPal Order (unchanged)
export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const client = await getPayPalClient(userId);
    console.log("client",client);

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