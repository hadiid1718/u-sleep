const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const { createCheckoutSession, verifySession, getSubscription, recordUsage, addCredits, cancelSubscription, createPortalSession, getPaymentHistory, getUsageHistory } = require('../controllers/PaymentController');

const PaymentRoutes = express.Router()

PaymentRoutes.post('/create-checkout-session', createCheckoutSession);
PaymentRoutes.get('/verify-session/:sessionId', verifySession);

// Protected routes (require authentication)
PaymentRoutes.get('/subscription/:userId', authenticateUser,getSubscription);
PaymentRoutes.post('/record-usage', authenticateUser, recordUsage);
PaymentRoutes.post('/add-credits', authenticateUser, addCredits);
PaymentRoutes.post('/cancel-subscription', authenticateUser, cancelSubscription);
PaymentRoutes.post('/create-portal-session', authenticateUser, createPortalSession);
PaymentRoutes.get('/payment-history/:userId', authenticateUser, getPaymentHistory);
PaymentRoutes.get('/usage-history/:userId', authenticateUser, getUsageHistory);




module.exports = PaymentRoutes