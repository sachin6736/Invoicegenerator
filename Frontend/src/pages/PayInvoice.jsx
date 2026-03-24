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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid payment link');
      setLoading(false);
      return;
    }

    fetch(`${API}/Invoice/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Invoice not found');
        return res.json();
      })
      .then(data => {
        setInvoice(data.invoice);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-700 font-medium">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <h1 className="text-5xl font-bold text-red-600 mb-6">⚠️</h1>
          <h2 className="text-2xl font-semibold mb-4">Invoice Not Found</h2>
          <p className="text-gray-600 mb-8">
            {error || 'This payment link is invalid or expired.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition font-medium"
          >
            Go to Homepage
          </button>
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
          <p className="text-xl text-gray-600 mb-8">
            Thank you! Invoice <strong>#{invoice.invoiceNumber}</strong> has been paid successfully.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currencySymbol = invoice.currency === 'USD' ? '$' : invoice.currency;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-2 rounded-full shadow-sm mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-600">Secure Checkout</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Pay Invoice</h1>
          <p className="text-gray-500 mt-2">#{invoice.invoiceNumber}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Invoice Summary */}
          <div className="p-8 md:p-12 border-b">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Auto Parts Store</h2>
                <p className="text-gray-500 mt-1">330 N Brand Blvd, Glendale, CA</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <p className="text-sm text-gray-500 mb-1">Bill To</p>
              <p className="font-semibold text-lg">{invoice.client.name}</p>
              <p className="text-gray-600">{invoice.client.email}</p>
              {invoice.client.phone && <p className="text-gray-600">{invoice.client.phone}</p>}
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-800 mb-4">Invoice Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-600">Description</th>
                      <th className="text-right py-3 font-medium text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-4 text-gray-700">{item.description}</td>
                        <td className="py-4 text-right font-medium text-gray-900">
                          {currencySymbol}{Number(item.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-end border-t border-gray-200 pt-6">
              <div className="text-right">
                <p className="text-gray-500">Total Amount Due</p>
                <p className="text-4xl font-bold text-blue-700 mt-1">
                  {currencySymbol}{invoice.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* PayPal Section */}
          <div className="p-8 md:p-12 bg-gray-50">
            <p className="text-center text-sm text-gray-500 mb-6">
              Complete your secure payment with PayPal
            </p>

            <PayPalScriptProvider options={{
              clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
              currency: invoice.currency || "USD",
              intent: "capture",
              environment: "production",
            }}>
              <div className="min-h-[220px] flex items-center justify-center">
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    color: "blue",
                    shape: "rect",
                    label: "pay",
                    height: 50,
                  }}
                  createOrder={async () => {
                    try {
                      const res = await fetch(`${API}/Payment/paypal/create-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ invoiceId: invoice._id })
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message || 'Failed to create order');
                      return data.orderId;
                    } catch (err) {
                      console.error(err);
                      throw err;
                    }
                  }}
                  onApprove={async (data) => {
                    try {
                      const res = await fetch(`${API}/Payment/paypal/capture/${data.orderID}`, {
                        method: 'POST'
                      });
                      const result = await res.json();

                      if (result.success) {
                        navigate('/payment-success', {
                          state: {
                            invoiceNumber: invoice.invoiceNumber,
                            amount: invoice.totalAmount,
                            currency: invoice.currency
                          }
                        });
                      } else {
                        toast.error('Payment capture failed. Please contact support.');
                      }
                    } catch (err) {
                      console.error(err);
                      toast.error('Payment processing failed. Please try again.');
                    }
                  }}
                  onError={(err) => {
                    console.error('PayPal Error:', err);
                    toast.error('Payment could not be processed. Please contact support.');
                  }}
                />
              </div>
            </PayPalScriptProvider>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Secured by PayPal • All transactions are encrypted and secure
        </p>
      </div>
    </div>
  );
}