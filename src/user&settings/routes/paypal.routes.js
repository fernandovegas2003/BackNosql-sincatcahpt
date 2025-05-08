import { Router } from 'express';
import { createPayPalOrder, capturePayPalOrder } from '../controllers/paypal.controller.js';

const router = Router();

router.post('/create-order', createPayPalOrder);
router.get('/capture-order', capturePayPalOrder);

export default router;