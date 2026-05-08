import express from 'express';
import {
  getSubscriptionUsage,
  getSubscriptionAnalytics,
  createRefundRequest,
  getUserRefundRequests,
  declineSubscriptionPlan,
} from '../controller/user.subscription.controller.js';
import authorize from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authorize);

// Subscription data routes
router.get('/subscription/usage', getSubscriptionUsage);
router.get('/subscription/analytics', getSubscriptionAnalytics);

// Refund request routes
router.post('/refund-request', createRefundRequest);
router.get('/refund-requests', getUserRefundRequests);

// Plan management routes
router.post('/subscription/decline', declineSubscriptionPlan);

export default router;
