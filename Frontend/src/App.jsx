// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

import Login from './pages/Login';
// import Register from './pages/Register';           // ← Added (if you have it)
import SendInvoice from './pages/SendInvoice';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import PayInvoice from './pages/PayInvoice';
import PaymentSuccess from './pages/PaymentSuccess';
import PaidInvoices from './pages/PaidInvoices';
import Settings from './pages/Settings';           // ← NEW: Settings page

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}

        {/* Protected routes with sidebar */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="send" element={<SendInvoice />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="paid-invoices" element={<PaidInvoices />} />
            <Route path="settings" element={<Settings />} />     {/* ← Added */}
            <Route index element={<SendInvoice />} />
          </Route>
        </Route>

        {/* Standalone public pages (no sidebar) */}
        <Route path="/pay/:id" element={<PayInvoice />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />

        <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
      </Routes>
    </AuthProvider>
  );
}