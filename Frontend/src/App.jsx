// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

import Login from './pages/Login';
import SendInvoice from './pages/SendInvoice';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import PayInvoice from './pages/PayInvoice';
import PaymentSuccess from './pages/PaymentSuccess';
import PaidInvoices from './pages/PaidInvoices';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes with sidebar */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="send" element={<SendInvoice />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="paid-invoices" element={<PaidInvoices />} />
            <Route index element={<SendInvoice />} />
          </Route>
        </Route>

        {/* Standalone public pages */}
        <Route path="/pay/:id" element={<PayInvoice />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />

        <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
      </Routes>
    </AuthProvider>
  );
}