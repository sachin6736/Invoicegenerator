import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function Settings() {
  const { token } = useAuth();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    accountName: '',
    clientId: '',
    secretKey: '',
    isSandbox: false,
  });

  const [showSecretKey, setShowSecretKey] = useState(false);

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      toast.error('Failed to load PayPal accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Add new account
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.accountName.trim() || !formData.clientId.trim() || !formData.secretKey.trim()) {
      toast.error('All fields are required');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('PayPal account added successfully!');

        // Reset form
        setFormData({
          accountName: '',
          clientId: '',
          secretKey: '',
          isSandbox: false,
        });
        setShowSecretKey(false);

        // Optimistic update
        setAccounts((prev) => [...prev, data.account]);
      } else {
        toast.error(data.message || 'Failed to add account');
      }
    } catch (err) {
      toast.error('Failed to add account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Set as default
  const setDefault = async (id) => {
    try {
      const res = await fetch(`${API}/settings/${id}/default`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Default account updated successfully');

        // Optimistic UI update
        setAccounts((prev) =>
          prev.map((acc) =>
            acc._id === id
              ? { ...acc, isDefault: true }
              : { ...acc, isDefault: false }
          )
        );
      } else {
        toast.error('Failed to update default account');
      }
    } catch (err) {
      toast.error('Failed to update default account');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Add New Account Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-10">
        <h2 className="text-xl font-semibold mb-6">Add New PayPal Account</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Account Name</label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Main Business Account"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Client ID</label>
              <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="AXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                spellCheck={false}
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Secret Key</label>
              <div className="relative">
                <input
                  type={showSecretKey ? "text" : "password"}
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Enter your PayPal secret key"
                  spellCheck={false}
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecretKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="sandbox"
              checked={formData.isSandbox}
              onChange={(e) => setFormData({ ...formData, isSandbox: e.target.checked })}
              className="w-5 h-5 accent-blue-600"
            />
            <label htmlFor="sandbox" className="text-sm font-medium cursor-pointer">
              Sandbox / Test Mode
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
          >
            {submitting ? 'Adding Account...' : 'Add PayPal Account'}
          </button>
        </form>
      </div>

      {/* List of Accounts */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h2 className="text-xl font-semibold mb-6">Your PayPal Accounts</h2>

        {loading ? (
          <p className="text-gray-500">Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <p className="text-gray-500 italic">No PayPal accounts added yet.</p>
        ) : (
          <div className="space-y-4">
            {accounts.map((acc) => (
              <div
                key={acc._id}
                className={`p-6 rounded-xl border flex justify-between items-center transition-all ${
                  acc.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{acc.accountName}</p>
                    {acc.isDefault && <CheckCircle className="text-blue-600" size={20} />}
                  </div>
                  <p className="font-mono text-sm text-gray-600 mt-1">
                    {acc.clientId?.substring(0, 15)}...
                  </p>
                  {acc.isSandbox && (
                    <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      Sandbox Mode
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setDefault(acc._id)}
                  disabled={acc.isDefault}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition ${
                    acc.isDefault
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {acc.isDefault ? '✓ Default' : 'Set as Default'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}