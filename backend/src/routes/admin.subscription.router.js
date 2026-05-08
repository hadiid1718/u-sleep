import express from 'express';
import {
  getAdminSubscriptions,
  approveSubscription,
  declineSubscription,
  getRefundRequests,
  approveRefund,
  declineRefund,
} from '../controller/admin.subscription.controller.js';
import adminAuthorize from '../middleware/admin.middleware.js';
import authorize from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authorize, adminAuthorize);

// Subscription management routes
router.get('/subscriptions', getAdminSubscriptions);
router.post('/subscriptions/:subscriptionId/approve', approveSubscription);
router.post('/subscriptions/:subscriptionId/decline', declineSubscription);

// Refund request routes
router.get('/refund-requests', getRefundRequests);
router.post('/refund-requests/:refundId/approve', approveRefund);
router.post('/refund-requests/:refundId/decline', declineRefund);

export default router;
