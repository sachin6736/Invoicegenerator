// src/pages/PayInvoice.jsx
import { useEffect, useState } from 'react';
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
  const [error, setError] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Fetch Invoice Details
  useEffect(() => {
    if (!id) {
      setError('Invalid payment link');
      setLoading(false);
      return;
    }

    fetch(`${API}/Invoice/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Invoice not found or expired');
        return res.json();
      })
      .then(data => {
        setInvoice(data.invoice || data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // Create PayPal Order when invoice is loaded
  useEffect(() => {
    if (!invoice || invoice.status === 'paid') return;

    const createOrder = async () => {
      setCreatingOrder(true);
      try {
        const res = await fetch(`${API}/Payment/paypal/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceId: invoice._id }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to create payment order');
        }

        setOrderId(data.orderId);
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Could not connect to payment gateway');
      } finally {
        setCreatingOrder(false);
      }
    };

    createOrder();
  }, [invoice]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-700">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <h1 className="text-5xl mb-6">⚠️</h1>
          <h2 className="text-2xl font-semibold mb-4">Invoice Not Found</h2>
          <p className="text-gray-600 mb-8">{error || 'This payment link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  if (invoice.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center">
          <div className="text-green-500 text-8xl mb-6">✓</div>
          <h1 className="text-4xl font-bold text-green-700 mb-4">Payment Completed</h1>
          <p className="text-xl text-gray-600">
            Thank you! Invoice <strong>#{invoice.invoiceNumber}</strong> has been paid.
          </p>
        </div>
      </div>
    );
  }

  const currencySymbol = invoice.currency === 'USD' ? '$' : invoice.currency;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 md:p-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Auto Parts Store</h2>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-75">Invoice</p>
                <p className="text-2xl font-bold">#{invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            {/* Client & Total */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-sm text-gray-500">BILL TO</p>
                <p className="font-semibold text-xl">{invoice.client.name}</p>
                <p className="text-gray-600">{invoice.client.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Due</p>
                <p className="text-4xl font-bold text-blue-700">
                  {currencySymbol}{invoice.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-12">
              <h3 className="font-semibold mb-4">Invoice Items</h3>
              <div className="bg-gray-50 rounded-2xl p-6">
                {invoice.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-3 border-b last:border-b-0">
                    <span>{item.description}</span>
                    <span className="font-medium">{currencySymbol}{Number(item.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PayPal Payment */}
            <div>
              <p className="text-center text-sm text-gray-500 mb-6">Secure payment powered by PayPal</p>

              {creatingOrder ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto mb-4"></div>
                  <p>Preparing secure checkout...</p>
                </div>
              ) : orderId ? (
                <PayPalScriptProvider options={{
                  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "YOUR_CLIENT_ID_HERE",
                  currency: invoice.currency || "USD",
                  intent: "capture",
                }}>
                  <PayPalButtons
                    style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay", height: 55 }}
                    createOrder={() => orderId}
                    onApprove={async (data) => {
                      try {
                        const res = await fetch(`${API}/Payment/paypal/capture/${data.orderID}`, {
                          method: 'POST',
                        });
                        const result = await res.json();

                        if (result.success) {
                          navigate('/payment-success', { 
                            state: { invoiceNumber: invoice.invoiceNumber, amount: invoice.totalAmount }
                          });
                        } else {
                          toast.error('Payment failed. Please try again.');
                        }
                      } catch (err) {
                        toast.error('Payment processing error');
                      }
                    }}
                    onError={(err) => {
                      console.error(err);
                      toast.error('Payment could not be processed. Please contact support.');
                    }}
                  />
                </PayPalScriptProvider>
              ) : (
                <div className="text-center py-12 text-red-600">
                  Failed to initialize payment. Please refresh the page.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}