import express from 'express';
import {  sendInvoice , getSentInvoices ,} from '../controllers/invoiceController.js';

const router = express.Router();

// Lead Routes
router.post('/send', sendInvoice);
router.get('/sent', getSentInvoices);

export default router;