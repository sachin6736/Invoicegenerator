import express from 'express';
import { addPaypalAccount, getPaypalAccounts, setDefaultAccount,deletePaypalAccount} from '../controllers/paypalAccountController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, addPaypalAccount);
router.get('/', authMiddleware, getPaypalAccounts);
router.patch('/:id/default', authMiddleware, setDefaultAccount);
router.delete('/:id', authMiddleware, deletePaypalAccount);

export default router;