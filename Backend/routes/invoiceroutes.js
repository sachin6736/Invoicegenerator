// src/routes/invoiceRouter.js  (or wherever your router is)

import express from 'express';
import { sendInvoice, getSentInvoices, getPaidInvoices, getInvoiceById , } from '../controllers/invoiceController.js';

const router = express.Router();

router.post('/send', sendInvoice);

// Specific routes first
router.get('/sent', getSentInvoices);
router.get('/paid',  getPaidInvoices);     

// Parametric route last
router.get('/:id', getInvoiceById);

export default router;