// src/routes/invoiceRouter.js  (or wherever your router is)

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { sendInvoice, getSentInvoices, getPaidInvoices, getInvoiceById ,updateNotes } from '../controllers/invoiceController.js';

const router = express.Router();

router.post('/send', authMiddleware,sendInvoice);

// Specific routes first
router.get('/sent', authMiddleware,getSentInvoices);
router.get('/paid',authMiddleware,  getPaidInvoices);     

// Parametric route last
router.get('/:id',authMiddleware, getInvoiceById);
router.patch('/:id/notes', authMiddleware, updateNotes);

export default router;