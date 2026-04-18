import { Router } from 'express';
import { handleStripeWebhook } from '../controller/billing.controller.js';

const webhookRouter = Router();

webhookRouter.post('/stripe', handleStripeWebhook);

export default webhookRouter;
