import { useState } from 'react';
import { toast } from 'sonner';
const API = import.meta.env.VITE_API_URL;

export default function SendInvoice() {
  const initialFormData = {
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    issueDate: new Date().toISOString().slice(0, 10),
    items: [{ description: '', amount: '' }],
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  const handleChange = (e, index = null) => {
    const { name, value } = e.target;
    if (index !== null) {
      const field = name.split('-')[1];
      const newItems = [...formData.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setFormData({ ...formData, items: newItems });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', amount: '' }],
    });
  };

  const removeItem = (index) => {
    let newItems = formData.items.filter((_, i) => i !== index);
    if (newItems.length === 0) newItems = [{ description: '', amount: '' }];
    setFormData({ ...formData, items: newItems });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const validateForm = () => {
    if (!formData.clientName.trim() || !formData.clientEmail.trim()) {
      toast.error('Client name and email are required');
      return false;
    }
    if (formData.items.some((item) => !item.description.trim() || !item.amount)) {
      toast.error('All items must have description and amount');
      return false;
    }
    if (totalAmount <= 0) {
      toast.error('Total amount must be greater than zero');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleSendInvoice = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const sendData = {
      client: {
        name: formData.clientName.trim(),
        email: formData.clientEmail.trim(),
        phone: formData.clientPhone?.trim() || undefined,
      },
      issueDate: new Date(),
      items: formData.items.map((item) => ({
        description: item.description.trim(),
        amount: Number(item.amount),
      })),
      totalAmount,
      notes: formData.notes?.trim() || undefined,
    };

    try {
      // 1. Save invoice to backend (no email sent)
      const res = await fetch(`${API}/Invoice/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Failed to create invoice');
      }

      const invoice = result.invoice;
      const invoiceNumber = invoice.invoiceNumber;
      const payNowUrl = `https://www.autopartsinvoices.xyz/pay/${invoice._id}`; // Use current origin (better than env for production)

      // 2. Build email content (same as before)
      const companyName = 'Auto Parts Store';
      const amountDue = totalAmount.toFixed(2);
      const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const itemsListText = invoice.items
        .map((item) => `  • ${item.description}: $${Number(item.amount).toFixed(2)}`)
        .join('\n');

      const subject = `Invoice ${invoiceNumber} from ${companyName}`;

      const body = `
Dear ${invoice.client.name || 'Customer'},

You have received a new invoice from ${companyName}.

Invoice Number: ${invoiceNumber}
Amount Due:    $${amountDue}
Due Date:      ${dueDateFormatted}

Invoice Items:
${itemsListText}

Total Due: $${amountDue}

To complete the payment securely, please visit this link:
${payNowUrl}

You will be redirected to a secure payment page powered by PayPal.

Kindly ensure payment is completed before the due date.
Questions? Just reply to this email — we're happy to help!

Thank you for your business!
${companyName}
equivise25@gmail.com
      `.trim();

      // 3. Open Gmail compose
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      const toEmail = encodeURIComponent(invoice.client.email);

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${toEmail}&su=${encodedSubject}&body=${encodedBody}`;

      window.open(gmailUrl, '_blank');

      toast.success(`Invoice ${invoiceNumber} created! Gmail compose opened — please review & send.`);
      resetForm();
    } catch (err) {
      toast.error(err.message || 'Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Create & Send Invoice</h1>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          ← Back
        </button>
      </div>

      <form className="space-y-10" onSubmit={handleSendInvoice}>
        {/* Client Information */}
        <section className="bg-white p-7 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>
        </section>

        {/* Items - unchanged */}
        <section className="bg-white p-7 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Items / Services</h2>
            <button
              type="button"
              onClick={addItem}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-sm"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-6">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-4 items-end border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
              >
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name={`item-description`}
                    value={item.description}
                    onChange={(e) => handleChange(e, index)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                  />
                </div>

                <div className="w-full sm:w-40">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name={`item-amount`}
                    value={item.amount}
                    onChange={(e) => handleChange(e, index)}
                    onWheel={(e) => e.target.blur()}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800 font-medium pt-2 sm:pt-8"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-right">
            <p className="text-xl font-semibold text-gray-900">
              Total: <span className="text-3xl font-bold text-blue-700">${totalAmount.toFixed(2)}</span>
            </p>
          </div>
        </section>

        {/* Notes & Send Button */}
        <section className="bg-white p-7 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes / Payment Terms
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
            placeholder="Payment terms, thank you note, bank details, etc..."
          />

          <div className="mt-10 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-10 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-sm min-w-[180px] ${
                loading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating & Opening Gmail...' : 'Send Invoice'}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}