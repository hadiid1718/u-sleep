import { Router } from 'express';
import {
  createCheckoutSession,
  stripeWebhook,
  verifySession,
  getMyPayments,
  getCoinBalance,
  getRevenueStats,
} from '../controller/payment.controller.js';
import authorize from '../middleware/auth.middleware.js';

const paymentRouter = Router();

// User routes (require auth)
paymentRouter.post(
  '/create-checkout-session',
  authorize,
  createCheckoutSession
);
paymentRouter.get('/verify-session/:sessionId', authorize, verifySession);
paymentRouter.get('/my-payments', authorize, getMyPayments);
paymentRouter.get('/coin-balance', authorize, getCoinBalance);

// Admin routes
paymentRouter.get('/revenue-stats', authorize, getRevenueStats);

// Stripe webhook (no auth - stripe sends this)
// Note: webhook needs raw body, handled in app.js
paymentRouter.post('/webhook', stripeWebhook);

export default paymentRouter;
