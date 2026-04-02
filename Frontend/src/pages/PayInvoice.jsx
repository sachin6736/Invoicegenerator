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
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Invoice Details
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

  // Create PayPal Order (Backend)
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
        console.log("✅ Order created successfully:", data.orderId);
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Failed to create payment order');
      } finally {
        setOrderLoading(false);
      }
    };

    createOrder();
  }, [invoice]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-xl">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error || 'Invoice not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 border-b">
          <h1 className="text-3xl font-bold text-center">Complete Your Payment</h1>
        </div>

        <div className="p-8">
          <div className="bg-gray-50 p-6 rounded-xl mb-8">
            <p className="text-sm text-gray-500">Invoice Number</p>
            <p className="text-2xl font-semibold">{invoice.invoiceNumber}</p>

            <p className="text-sm text-gray-500 mt-4">Amount Due</p>
            <p className="text-4xl font-bold text-green-600">
              ${invoice.totalAmount.toFixed(2)}
            </p>
          </div>

          {orderLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto"></div>
              <p className="mt-4">Creating secure payment order...</p>
            </div>
          )}

          {orderId && (
            <PayPalScriptProvider
              options={{
                clientId: "YOUR_SANDBOX_CLIENT_ID_HERE", // ← Put your sandbox client ID here temporarily for testing
                currency: invoice.currency || "USD",
                intent: "capture",
              }}
            >
              <PayPalButtons
                style={{ layout: "vertical", height: 55 }}
                createOrder={() => orderId}   // ← Important: Use the orderId from backend
                onApprove={async (data) => {
                  try {
                    const res = await fetch(`${API}/Payment/paypal/capture/${data.orderID}`, {
                      method: 'POST',
                    });
                    const result = await res.json();

                    if (result.success) {
                      toast.success('Payment successful!');
                      navigate('/payment-success', {
                        state: {
                          invoiceNumber: invoice.invoiceNumber,
                          amount: invoice.totalAmount,
                        }
                      });
                    } else {
                      toast.error('Payment capture failed');
                    }
                  } catch (err) {
                    toast.error('Something went wrong');
                  }
                }}
                onError={(err) => {
                  console.error(err);
                  toast.error('Payment could not be processed');
                }}
              />
            </PayPalScriptProvider>
          )}
        </div>
      </div>
    </div>
  );
}