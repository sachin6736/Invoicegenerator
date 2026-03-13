// src/pages/PayInvoice.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const API = import.meta.env.VITE_API_URL;

export default function PayInvoice() {
  const { id } = useParams(); // invoice _id
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  if (loading) return <div className="text-center py-20 text-lg">Loading invoice...</div>;
  if (error) return <div className="text-center py-20 text-red-600 text-xl">{error}</div>;

  if (invoice.status === 'paid') {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-6">Payment Completed</h1>
        <p className="text-xl">Thank you! This invoice has already been paid.</p>
      </div>
    );
  }

  // Optional: nicer currency symbol
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
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="bg-white rounded-2xl shadow-xl p-10">
        <h1 className="text-3xl font-bold text-center mb-8">
          Pay Invoice #{invoice.invoiceNumber}
        </h1>

        <div className="text-center mb-12 space-y-4">
          <p className="text-3xl font-semibold text-blue-700">
            {getCurrencySymbol(invoice.currency)} {invoice.totalAmount.toFixed(2)}
          </p>
          <p className="text-gray-600 text-lg">
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
                  `${API}/Payment/paypal/capture/${data.orderID}`, // ← fixed: orderID (capital I)
                  { method: 'POST' }
                );

                const result = await res.json();
                if (result.success) {
                  alert('Payment successful! Thank you.');
                  navigate('/invoices');
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