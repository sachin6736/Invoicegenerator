// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout'; 

import SendInvoice from './pages/SendInvoice';
import Invoices from './pages/Invoices';
// import Drafts  from './pages/Drafts';


export default function App() {
  return (
    <Routes>

      <Route element={<AppLayout />}>
        <Route path="send" element={<SendInvoice />} />
       <Route path="invoices" element={<Invoices />} />
      {/* <Route path="drafts"  element={<Drafts />} /> */}
        <Route index element={<SendInvoice />} />
        <Route path="*" element={<div className="p-8 text-center">Working on Send Invoice page...</div>} />
      </Route>
    </Routes>
  );
}