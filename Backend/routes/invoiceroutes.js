import express from 'express';
import { createdraft , sendInvoice , getSentInvoices} from '../controllers/invoiceController.js';

const router = express.Router();

// Lead Routes
router.post('/createdraft',createdraft)
router.post('/send', sendInvoice);
router.get('/sent', getSentInvoices);

export default router;