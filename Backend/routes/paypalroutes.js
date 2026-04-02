import express from 'express';
import {createPayPalOrder, capturePayPalOrder } from '../controllers/paypalController.js';
// import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/paypal/create-order', createPayPalOrder);
router.post('/paypal/capture/:orderId', capturePayPalOrder);

export default router