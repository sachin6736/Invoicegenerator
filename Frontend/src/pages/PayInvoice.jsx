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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error || 'Invalid or expired payment link'}</p>
          <p className="text-sm text-gray-500 mb-8">
            This page can only be accessed via the "Pay Now" link in your invoice email.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
        <div className="bg-white rounded-xl shadow-lg p-10 max-w-lg w-full text-center">
          <div className="text-green-500 text-6xl mb-6">✓</div>
          <h1 className="text-4xl font-bold text-green-600 mb-4">Payment Completed</h1>
          <p className="text-xl text-gray-700 mb-8">
            Thank you! Invoice #{invoice.invoiceNumber} has been paid successfully.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

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
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-3xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Pay Invoice #{invoice.invoiceNumber}
          </h1>
          <p className="text-lg text-gray-600">
            {getCurrencySymbol(invoice.currency)} {invoice.totalAmount.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Due on: {new Date(invoice.dueDate).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        <PayPalScriptProvider options={{
          clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
          currency: invoice.currency || "USD",
        }}>
          <PayPalButtons
            style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
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
                  alert('Payment successful! Thank you.');
                  navigate('/'); // or a custom success page
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

        <p className="text-center text-sm text-gray-500 mt-10">
          Secure payment powered by PayPal
        </p>
      </div>
    </div>
  );
}