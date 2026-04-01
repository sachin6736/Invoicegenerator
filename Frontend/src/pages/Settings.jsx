// src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

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

    if (!formData.accountName || !formData.clientId || !formData.secretKey) {
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

        // Immediately update the list without full refetch
        setAccounts((prev) => [...prev, data.account]);
      } else {
        toast.error(data.message || 'Failed to add account');
      }
    } catch (err) {
      toast.error('Failed to add account');
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
        toast.success('Default account updated');
        
        // Optimistically update UI
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
      toast.error('Failed to update default');
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Axxxxxxxxxxxxxxxxxxxxxxxx"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Secret Key</label>
              <input
                type="password"
                value={formData.secretKey}
                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your PayPal secret key"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isSandbox}
              onChange={(e) => setFormData({ ...formData, isSandbox: e.target.checked })}
            />
            <label className="text-sm">Sandbox / Test Mode</label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          <p className="text-gray-500">No accounts added yet.</p>
        ) : (
          <div className="space-y-4">
            {accounts.map((acc) => (
              <div
                key={acc._id}
                className={`p-6 rounded-xl border flex justify-between items-center ${
                  acc.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div>
                  <p className="font-semibold">{acc.accountName}</p>
                  <p className="text-sm text-gray-500">
                    {acc.clientId.substring(0, 12)}... 
                    {acc.isSandbox && <span className="ml-2 text-amber-600">(Sandbox)</span>}
                  </p>
                </div>
                <button
                  onClick={() => setDefault(acc._id)}
                  disabled={acc.isDefault}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
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