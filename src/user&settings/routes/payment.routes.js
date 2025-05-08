import { Router } from 'express';
import { createPaymentIntent, stripeWebhook } from '../controllers/payment.controller.js';

const router = Router();

// Ruta para crear intención de pago
router.post('/create-payment-intent', createPaymentIntent);

// Ruta para el webhook de Stripe
// Nota: Esta ruta NO debe usar express.json() middleware
router.post('/stripe/webhook', stripeWebhook);

export default router;