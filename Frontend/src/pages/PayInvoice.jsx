
// src/pages/PayInvoice.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL;

export default function PayInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [paypalClientId, setPaypalClientId] = useState(null);   // ← New
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Invoice
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`${API}/Invoice/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Invoice not found');
        setInvoice(data.invoice || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  // Create PayPal Order on Backend
  useEffect(() => {
    if (!invoice || orderId) return;

    const createOrder = async () => {
      setOrderLoading(true);
      try {
        const res = await fetch(`${API}/Payment/paypal/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceId: invoice._id }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        setOrderId(data.orderId);
        setPaypalClientId(data.clientId);        // ← Get clientId from backend
        console.log("✅ Order created with Client ID:", data.clientId);
      } catch (err) {
        toast.error(err.message || 'Failed to create payment order');
      } finally {
        setOrderLoading(false);
      }
    };

    createOrder();
  }, [invoice]);

  if (loading || orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-xl">{orderLoading ? 'Creating secure payment...' : 'Loading invoice...'}</p>
        </div>
      </div>
    );
  }

  if (error || !invoice || !paypalClientId) {
    return <div className="text-center py-20 text-red-600">{error || 'Payment setup failed'}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Complete Your Payment</h1>

        <div className="bg-gray-50 p-6 rounded-xl mb-8 text-center">
          <p className="text-gray-500">Invoice</p>
          <p className="text-3xl font-bold">{invoice.invoiceNumber}</p>
          <p className="text-4xl font-bold text-green-600 mt-2">
            ${invoice.totalAmount.toFixed(2)}
          </p>
        </div>

        <PayPalScriptProvider
          options={{
            clientId: paypalClientId,        // ← Dynamic Client ID from Backend
            currency: invoice.currency || "USD",
            intent: "capture",
          }}
        >
          <PayPalButtons
            style={{ layout: "vertical", height: 55 }}
            createOrder={() => orderId}
            onApprove={async (data) => {
              try {
                const res = await fetch(`${API}/Payment/paypal/capture/${data.orderID}`, {
                  method: 'POST',
                });
                const result = await res.json();

                if (result.success) {
                  toast.success('Payment Successful!');
                  navigate('/payment-success', { 
                    state: { invoiceNumber: invoice.invoiceNumber, amount: invoice.totalAmount } 
                  });
                }
              } catch (err) {
                toast.error('Payment capture failed');
              }
            }}
            onError={(err) => toast.error('Payment failed. Please try again.')}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
}