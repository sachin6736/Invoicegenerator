// src/components/Sidebar.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Send,
  UsersRound,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle,
} from 'lucide-react';

const menuItems = [
  { to: '/send', label: 'Send', icon: Send },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/paid-invoices', label: 'Paid', icon: CheckCircle },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false); // ← for settings dropdown

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();                    // clears token from context & localStorage
    setSettingsOpen(false);
    setMobileOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile hamburger */}
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
        {/* Logo area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <span className="text-2xl font-bold text-blue-500">Invoice Generator</span>
        </div>

        {/* Menu */}
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

        {/* Settings + Logout at bottom */}
        <div className="absolute bottom-6 left-0 right-0 px-3">
          <div className="relative">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Settings size={20} />
              Settings
            </button>

            {/* Dropdown Menu */}
            {settingsOpen && (
              <div className="absolute bottom-14 left-0 w-full bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-gray-700 transition-colors"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Click outside to close settings dropdown */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}