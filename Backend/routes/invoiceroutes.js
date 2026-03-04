import express from 'express';
import {  sendInvoice , getSentInvoices ,getInvoiceById} from '../controllers/invoiceController.js';

const router = express.Router();

// Lead Routes
router.post('/send', sendInvoice);
router.get('/sent', getSentInvoices);
router.get('/:id', getInvoiceById);

export default router;