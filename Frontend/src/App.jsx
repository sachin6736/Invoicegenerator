// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout'; 

import SendInvoice from './pages/SendInvoice';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import PayInvoice from './pages/PayInvoice';  // your payment page

export default function App() {
  return (
    <Routes>

      {/* Protected pages — with sidebar/layout */}
      <Route element={<AppLayout />}>
        <Route path="send" element={<SendInvoice />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route index element={<SendInvoice />} />
      </Route>

      {/* Standalone payment page — NO layout/sidebar */}
      <Route path="/pay/:id" element={<PayInvoice />} />

      {/* Fallback */}
      <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />

    </Routes>
  );
}