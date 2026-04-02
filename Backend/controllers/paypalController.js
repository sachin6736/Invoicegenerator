// controllers/paypalController.js
import paypal from '@paypal/checkout-server-sdk';
import Invoice from '../Models/Invoice.js';
import PaypalAccount from '../Models/PaypalAccount.js';

const getPayPalClientForInvoice = async (invoice) => {
  // Try to find the default account of the person who created the invoice
  if (invoice.createdBy) {
    const account = await PaypalAccount.findOne({
      userId: invoice.createdBy,
      isDefault: true
    });

    if (account) {
      console.log(`Using default account: ${account.accountName}`);
      const env = account.isSandbox
        ? new paypal.core.SandboxEnvironment(account.clientId, account.secretKey)
        : new paypal.core.LiveEnvironment(account.clientId, account.secretKey);
      
      return new paypal.core.PayPalHttpClient(env);
    }
  }

  // Fallback: Use any default account in the system
  const anyDefault = await PaypalAccount.findOne({ isDefault: true });
  if (anyDefault) {
    console.log(`Using system default account: ${anyDefault.accountName}`);
    const env = anyDefault.isSandbox
      ? new paypal.core.SandboxEnvironment(anyDefault.clientId, anyDefault.secretKey)
      : new paypal.core.LiveEnvironment(anyDefault.clientId, anyDefault.secretKey);
    
    return new paypal.core.PayPalHttpClient(env);
  }

  throw new Error('No PayPal account configured for this invoice. Please contact the business.');
};

// Create PayPal Order - PUBLIC ROUTE (no auth required)
export const createPayPalOrder = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice already paid' });
    }

    const client = await getPayPalClientForInvoice(invoice);
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
      message: err.message || 'Failed to create PayPal order' 
    });
  }
};

// Capture can remain protected if you want
export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const invoice = await Invoice.findOne({ paypalOrderId: orderId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const client = await getPayPalClientForInvoice(invoice);

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    const response = await client.execute(request);

    const capture = response.result.purchase_units[0].payments.captures[0];

    await Invoice.findOneAndUpdate(
      { paypalOrderId: orderId },
      {
        status: 'paid',
        paidAt: new Date(),
        paypalCaptureId: capture.id,
      }
    );

    res.json({ success: true, message: 'Payment captured successfully' });

  } catch (err) {
    console.error('Capture Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};