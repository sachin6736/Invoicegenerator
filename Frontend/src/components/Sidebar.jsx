// src/components/Sidebar.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  FileText,
  CheckCircle,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';

const menuItems = [
  { to: '/send', label: 'Send Invoice', icon: Send },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/paid-invoices', label: 'Paid Invoices', icon: CheckCircle },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setSettingsOpen(false);
    setMobileOpen(false);
    navigate('/login', { replace: true });
  };

  const handleAccountClick = () => {
    setSettingsOpen(false);
    setMobileOpen(false);
    navigate('/settings');
  };

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-gray-800 p-2 rounded-md text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-100
          transform transition-transform duration-300 lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <span className="text-2xl font-bold text-blue-500">Invoice Generator</span>
        </div>

        {/* Main Menu */}
        <nav className="mt-8 px-3 flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={20} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Settings at Bottom with Dropdown */}
        <div className="absolute bottom-6 left-0 right-0 px-3">
          <div className="relative">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <SettingsIcon size={20} />
              Settings
            </button>

            {/* Dropdown Menu */}
            {settingsOpen && (
              <div className="absolute bottom-full left-0 w-full bg-gray-800 rounded-lg shadow-xl py-2 mb-2 z-50 border border-gray-700">
                {/* Account Option */}
                <button
                  onClick={handleAccountClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <User size={18} />
                  Account
                </button>

                {/* Logout Option */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-gray-700 transition-colors border-t border-gray-700 mt-1"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Click outside to close dropdown */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}