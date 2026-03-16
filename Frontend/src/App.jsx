// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';

import SendInvoice from './pages/SendInvoice';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import PayInvoice from './pages/PayInvoice';
import PaymentSuccess from './pages/PaymentSuccess';  // ← add this import

export default function App() {
  return (
    <Routes>
      {/* Pages with sidebar */}
      <Route element={<AppLayout />}>
        <Route path="send" element={<SendInvoice />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route index element={<SendInvoice />} />
      </Route>

      {/* Standalone pages — no sidebar */}
      <Route path="/pay/:id" element={<PayInvoice />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />

      <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
    </Routes>
  );
}