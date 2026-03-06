// src/pages/InvoiceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Printer, Clock, CheckCircle } from 'lucide-react';
const API = import.meta.env.VITE_API_URL;

export default function InvoiceDetail() {
  const { id } = useParams(); // Get invoice ID from URL
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/Invoice/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch invoice');
      }

      setInvoice(data.invoice);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Error loading invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center p-10 text-red-600">
        <p className="text-xl font-semibold">Error: {error || 'Invoice not found'}</p>
        <button
          onClick={() => navigate('/invoices')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Invoice {invoice.invoiceNumber}
          </h1>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
            <Printer size={18} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-end">
        <span
          className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${
            invoice.status === 'sent'
              ? 'bg-blue-100 text-blue-800'
              : invoice.status === 'paid'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {invoice.status === 'sent' && <Clock size={16} className="mr-1.5" />}
          {invoice.status === 'paid' && <CheckCircle size={16} className="mr-1.5" />}
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </span>
      </div>

      {/* Main Content - Card-like */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        {/* Top Section: Dates & Client */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-lg font-semibold mb-2">Issue Date</h3>
            <p className="text-gray-700">
              {format(new Date(invoice.issueDate), 'dd MMMM yyyy')}
            </p>
            {invoice.sentAt && (
              <p className="text-sm text-gray-500 mt-1">
                Sent on {format(new Date(invoice.sentAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Client</h3>
            <p className="font-medium">{invoice.client.name}</p>
            <p className="text-gray-600">{invoice.client.email}</p>
            {invoice.client.phone && <p className="text-gray-600">{invoice.client.phone}</p>}
            {invoice.client.address && <p className="text-gray-600">{invoice.client.address}</p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-4">Invoice Items</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">Total</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    ₹{invoice.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes & Payment Terms */}
        {(invoice.notes) && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Notes</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-700">
              {invoice.notes}
            </div>
          </div>
        )}

        {/* You can add Payment Terms section here later */}
        {/* <div>
          <h3 className="text-lg font-semibold mb-2">Payment Terms</h3>
          <p className="text-gray-700">Due within 15 days. Bank transfer to...</p>
        </div> */}
      </div>
    </div>
  );
}