// src/pages/PaidInvoices.jsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { FileText, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

export default function PaidInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPaidInvoices = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/Invoice/paid?page=${page}&limit=10`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch paid invoices');
      }

      setInvoices(data.invoices || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Error loading paid invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaidInvoices(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPaidInvoices(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10 text-red-600">
        <p className="text-xl font-semibold">Error: {error}</p>
        <button
          onClick={() => fetchPaidInvoices(1)}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center p-10 text-gray-500">
        <CheckCircle size={64} className="mx-auto mb-4 opacity-50 text-green-500" />
        <h2 className="text-2xl font-semibold mb-2">No paid invoices yet</h2>
        <p>Once payments are completed, they will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Paid Invoices</h1>
        <button
          onClick={() => navigate('/invoices')}
          className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
        >
          View All Invoices
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr
                  key={invoice._id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/invoices/${invoice._id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {invoice.invoiceNumber || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.client?.name || '—'}</div>
                    <div className="text-sm text-gray-500">{invoice.client?.email || '—'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.issueDate
                      ? format(new Date(invoice.issueDate), 'dd MMM yyyy')
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.paidAt
                      ? format(new Date(invoice.paidAt), 'dd MMM yyyy, hh:mm a')
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${invoice.totalAmount?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle size={14} className="mr-1" />
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{invoices.length}</span> of{' '}
            <span className="font-medium">{pagination.totalItems}</span> paid invoices
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-sm font-medium">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}