import Subscription from '../models/subscription.model.js';
import RefundRequest from '../models/refundRequest.model.js';
import User from '../models/user.model.js';
import { stripe } from '../config/stripe.js';
import notificationService from '../services/notification.service.js';

/**
 * Get all subscriptions for admin (with filters)
 */
export const getAdminSubscriptions = async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;

    const filter = status === 'all' ? {} : { status };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const subscriptions = await Subscription.find(filter)
      .populate('userId', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Subscription.countDocuments(filter);

    res.json({
      success: true,
      subscriptions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a subscription (grant user access)
 */
export const approveSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const { userId } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      const error = new Error('Subscription not found');
      error.statusCode = 404;
      throw error;
    }

    // Update subscription status
    subscription.status = 'active';
    subscription.activatedAt = new Date();
    subscription.adminApprovedAt = new Date();
    subscription.adminApprovedBy = req.admin?._id || req.user?._id;
    await subscription.save();

    // Notify user
    await notificationService.createNotification({
      userId: subscription.userId,
      title: 'Subscription Approved',
      message: `Your ${subscription.plan} plan has been approved and is now active!`,
      type: 'subscription',
      relatedId: subscriptionId,
    });

    res.json({
      success: true,
      message: 'Subscription approved',
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Decline a subscription
 */
export const declineSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const { userId, reason = '' } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      const error = new Error('Subscription not found');
      error.statusCode = 404;
      throw error;
    }

    // Update subscription status
    subscription.status = 'declined';
    subscription.declinedAt = new Date();
    subscription.declinedReason = reason;
    subscription.declinedBy = req.admin?._id || req.user?._id;
    await subscription.save();

    // Process refund if payment was made
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.del(subscription.stripeSubscriptionId, {
          invoice_now: false,
        });
      } catch (error) {
        console.error('Error deleting Stripe subscription:', error);
      }
    }

    // Notify user
    await notificationService.createNotification({
      userId: subscription.userId,
      title: 'Subscription Declined',
      message: `Your ${subscription.plan} plan request was declined. Reason: ${reason || 'No reason provided'}`,
      type: 'subscription',
      relatedId: subscriptionId,
    });

    res.json({
      success: true,
      message: 'Subscription declined',
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all refund requests for admin
 */
export const getRefundRequests = async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;

    const filter = status === 'all' ? {} : { status };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const refundRequests = await RefundRequest.find(filter)
      .populate('userId', 'email firstName lastName')
      .populate('subscriptionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RefundRequest.countDocuments(filter);

    res.json({
      success: true,
      refundRequests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a refund request
 */
export const approveRefund = async (req, res, next) => {
  try {
    const { refundId } = req.params;
    const { userId } = req.body;

    const refundRequest = await RefundRequest.findById(refundId);
    if (!refundRequest) {
      const error = new Error('Refund request not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if within 5-day window
    const daysSince = Math.ceil(
      (new Date() - new Date(refundRequest.purchaseDate)) / (1000 * 60 * 60 * 24)
    );

    if (daysSince > 5) {
      const error = new Error('Refund window expired (5 days)');
      error.statusCode = 400;
      throw error;
    }

    // Process refund via Stripe
    let stripeRefundId = null;
    try {
      const refund = await stripe.refunds.create({
        amount: Math.round(refundRequest.amount * 100),
        charge: refundRequest.stripeChargeId, // Assuming this field exists in refund request
      });
      stripeRefundId = refund.id;
    } catch (error) {
      console.error('Error processing Stripe refund:', error);
    }

    // Update refund request status
    refundRequest.status = 'refunded';
    refundRequest.processedAt = new Date();
    refundRequest.refundedAt = new Date();
    refundRequest.stripeRefundId = stripeRefundId;
    await refundRequest.save();

    // Cancel subscription if still active
    const subscription = await Subscription.findById(refundRequest.subscriptionId);
    if (subscription && subscription.status === 'active') {
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      await subscription.save();
    }

    // Notify user
    await notificationService.createNotification({
      userId: refundRequest.userId,
      title: 'Refund Approved',
      message: `Your refund of $${refundRequest.amount} has been approved and processed.`,
      type: 'refund',
      relatedId: refundId,
    });

    res.json({
      success: true,
      message: 'Refund approved and processed',
      refundRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Decline a refund request
 */
export const declineRefund = async (req, res, next) => {
  try {
    const { refundId } = req.params;
    const { userId, reason = '' } = req.body;

    const refundRequest = await RefundRequest.findById(refundId);
    if (!refundRequest) {
      const error = new Error('Refund request not found');
      error.statusCode = 404;
      throw error;
    }

    // Update refund request status
    refundRequest.status = 'declined';
    refundRequest.processedAt = new Date();
    refundRequest.declinedReason = reason;
    await refundRequest.save();

    // Notify user
    await notificationService.createNotification({
      userId: refundRequest.userId,
      title: 'Refund Declined',
      message: `Your refund request was declined. Reason: ${reason || 'No reason provided'}`,
      type: 'refund',
      relatedId: refundId,
    });

    res.json({
      success: true,
      message: 'Refund declined',
      refundRequest,
    });
  } catch (error) {
    next(error);
  }
};
