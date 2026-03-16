// src/pages/PaymentSuccess.jsx
import { useLocation } from 'react-router-dom';

export default function PaymentSuccess() {
  const location = useLocation();
  const { invoiceNumber, amount, currency } = location.state || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 md:p-16 max-w-lg w-full text-center">
        {/* Big success icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg
            className="w-16 h-16 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-green-700 mb-6">
          Payment Successful!
        </h1>

        <p className="text-xl text-gray-700 mb-8">
          Thank you — your payment has been received.
        </p>

        {invoiceNumber && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <p className="text-lg font-medium text-gray-800 mb-3">
              Invoice #{invoiceNumber}
            </p>
            <p className="text-2xl font-bold text-blue-700">
              {currency || '$'}{Number(amount || 0).toFixed(2)} paid
            </p>
          </div>
        )}

        <p className="text-gray-600 text-lg mb-6">
          A receipt has been sent to your email.
        </p>

        <p className="text-gray-500 text-base">
          You can safely close this tab/window now.
        </p>
      </div>
    </div>
  );
}