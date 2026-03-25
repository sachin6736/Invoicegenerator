// src/pages/InvoiceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format, differenceInCalendarDays } from 'date-fns';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Edit3, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchInvoice = async () => {
    if (!token) {
      setError("Please login to view invoice details");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/Invoice/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || 'Failed to fetch invoice');
      }

      setInvoice(data.invoice);
      setNotesInput(data.invoice.notes || '');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Error loading invoice details');
    } finally {
      setLoading(false);
    }
  };

  // Save notes to backend
  const saveNotes = async () => {
    setSavingNotes(true);

    try {
      const res = await fetch(`${API}/Invoice/${id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: notesInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save notes');
      }

      setInvoice(data.invoice);
      setIsEditingNotes(false);
      toast.success('Notes updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested invoice could not be found.'}</p>
          <button
            onClick={() => navigate('/invoices')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const issueDate = new Date(invoice.issueDate);
  const dueDate = new Date(invoice.dueDate);
  const daysUntilDue = differenceInCalendarDays(dueDate, new Date());
  const isOverdue = daysUntilDue < 0 && invoice.status !== 'paid';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Issued on {format(issueDate, 'MMMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {invoice.status === 'paid' ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              <CheckCircle2 size={16} />
              Paid
            </span>
          ) : isOverdue ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-100 text-red-800 text-sm font-medium">
              <AlertCircle size={16} />
              Overdue
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              <Clock size={16} />
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Client & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Billed To</h3>
            <div className="space-y-1.5">
              <p className="font-medium text-gray-900">{invoice.client.name}</p>
              <p className="text-gray-600">{invoice.client.email}</p>
              {invoice.client.phone && <p className="text-gray-600">{invoice.client.phone}</p>}
              {invoice.client.address && (
                <p className="text-gray-600 whitespace-pre-line">{invoice.client.address}</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details</h3>
              <div className="space-y-2 text-gray-700">
                <p>
                  <span className="font-medium">Issue Date:</span>{' '}
                  {format(issueDate, 'MMMM d, yyyy')}
                </p>
                <p>
                  <span className="font-medium">Due Date:</span>{' '}
                  {format(dueDate, 'MMMM d, yyyy')}
                </p>
                {invoice.status !== 'paid' && (
                  <p className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                    {isOverdue
                      ? `Overdue by ${Math.abs(daysUntilDue)} days`
                      : `Due in ${daysUntilDue} days`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Invoice Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Description
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {invoice.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      ${Number(item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td className="px-6 py-4 text-right text-gray-900">Total Amount</td>
                  <td className="px-6 py-4 text-right text-xl font-bold text-gray-900">
                    ${invoice.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes Section with Edit Option */}
        <div className="px-8 pb-8 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
            <button
              onClick={() => setIsEditingNotes(!isEditingNotes)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Edit3 size={16} />
              {isEditingNotes ? 'Cancel' : 'Edit Notes'}
            </button>
          </div>

          {isEditingNotes ? (
            <div className="space-y-4">
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Add notes, payment terms, bank details, etc..."
              />
              <div className="flex gap-3">
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingNotes(false);
                    setNotesInput(invoice.notes || '');
                  }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 text-gray-700 whitespace-pre-line leading-relaxed min-h-[100px]">
              {invoice.notes || 'No notes added yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}