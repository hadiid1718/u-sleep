import { Router } from 'express';
import authorize from '../middleware/auth.middleware.js';
import {
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  getPlans,
  cancelSubscription,
} from '../controller/billing.controller.js';

const billingRouter = Router();

billingRouter.post(
  '/create-checkout-session',
  authorize,
  createCheckoutSession
);
billingRouter.post('/create-portal-session', authorize, createPortalSession);
billingRouter.get('/subscription', authorize, getSubscription);
billingRouter.get('/plans', getPlans);
billingRouter.post('/cancel', authorize, cancelSubscription);

export default billingRouter;
