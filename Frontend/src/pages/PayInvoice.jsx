// src/pages/PayInvoice.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-6"></div>
          <p className="text-xl text-gray-700 font-medium">Loading your invoice...</p>
        </div>
      </div>
    );
  }

  // Error / invalid link
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-6">Oops!</h1>
          <p className="text-xl text-gray-700 mb-8">
            {error || 'Invalid or expired payment link'}
          </p>
          <p className="text-gray-600 mb-10">
            This page can only be accessed via the "Pay Now" link in your invoice email.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-10 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-md"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Already paid
  if (invoice.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 md:p-16 max-w-lg w-full text-center">
          <div className="text-green-500 text-7xl mb-8">✓</div>
          <h1 className="text-4xl md:text-5xl font-bold text-green-700 mb-6">
            Already Paid
          </h1>
          <p className="text-xl text-gray-700 mb-10">
            Thank you! Invoice #{invoice.invoiceNumber} has already been paid.
          </p>
          <p className="text-gray-600 mb-10">
            A receipt was sent to your email at the time of payment.
          </p>
        </div>
      </div>
    );
  }

  // Active payment page
  const getCurrencySymbol = (cur) => {
    switch (cur) {
      case 'USD': return '$';
      case 'INR': return '₹';
      case 'AED': return 'د.إ ';
      case 'EUR': return '€';
      default: return cur;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-3xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Pay Invoice #{invoice.invoiceNumber}
          </h1>

          <div className="inline-block bg-blue-50 px-6 py-3 rounded-full mb-6">
            <p className="text-3xl font-bold text-blue-700">
              {getCurrencySymbol(invoice.currency)} {invoice.totalAmount.toFixed(2)}
            </p>
          </div>

          <p className="text-lg text-gray-600">
            Due on: {new Date(invoice.dueDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="mb-10">
          <PayPalScriptProvider options={{
            clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
            currency: invoice.currency || "USD",
          }}>
            <PayPalButtons
              style={{ 
                layout: "vertical", 
                color: "blue", 
                shape: "rect", 
                label: "pay",
                height: 48
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
                  const res = await fetch(
                    `${API}/Payment/paypal/capture/${data.orderID}`,
                    { method: 'POST' }
                  );

                  const result = await res.json();

                  if (result.success) {
                    // Redirect to clean success page with invoice info
                    navigate('/payment-success', {
                      state: {
                        invoiceNumber: invoice.invoiceNumber,
                        amount: invoice.totalAmount,
                        currency: invoice.currency
                      }
                    });
                  } else {
                    alert('Payment capture failed. Please contact support.');
                  }
                } catch (err) {
                  console.error(err);
                  alert('Something went wrong during payment processing.');
                }
              }}
              onError={(err) => {
                console.error('PayPal Error:', err);
                alert('Payment could not be processed. Please try again or contact support.');
              }}
            />
          </PayPalScriptProvider>
        </div>

        <p className="text-center text-sm text-gray-500">
          Secure payment powered by PayPal
        </p>
      </div>
    </div>
  );
}