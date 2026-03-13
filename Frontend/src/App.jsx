// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout'; 

import SendInvoice from './pages/SendInvoice';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import PayInvoice from './pages/PayInvoice';  // ← ADD THIS IMPORT

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="send" element={<SendInvoice />} />
        <Route path="invoices" element={<Invoices />} />
        {/* <Route path="drafts" element={<Drafts />} /> */}
        
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/pay/:id" element={<PayInvoice />} />   {/* ← ADD THIS LINE */}

        <Route index element={<SendInvoice />} />
        <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
      </Route>
    </Routes>
  );
}