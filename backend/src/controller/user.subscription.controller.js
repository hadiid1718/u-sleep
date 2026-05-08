import Subscription from '../models/subscription.model.js';
import RefundRequest from '../models/refundRequest.model.js';
import UsageRecord from '../models/usageRecord.model.js';
import notificationService from '../services/notification.service.js';

const getAuthUserId = req =>
  String(req.user?._id || req.user?.id || '');

/**
 * Get user subscription usage data
 */
export const getSubscriptionUsage = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      const error = new Error('No subscription found');
      error.statusCode = 404;
      throw error;
    }

    // Get usage records for current period
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usageRecords = await UsageRecord.find({
      userId,
      createdAt: { $gte: currentMonth },
    });

    const totalUsed = usageRecords.reduce((sum, record) => sum + (record.quantity || 1), 0);

    res.json({
      success: true,
      subscription,
      usage: {
        total: totalUsed,
        records: usageRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription analytics data
 */
export const getSubscriptionAnalytics = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    // Get last 30 days of usage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageRecords = await UsageRecord.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: -1 });

    // Daily proposals
    const dailyProposals = [];
    const proposalsByDate = {};

    usageRecords.forEach(record => {
      const date = new Date(record.createdAt).toLocaleDateString();
      proposalsByDate[date] = (proposalsByDate[date] || 0) + 1;
    });

    Object.entries(proposalsByDate).forEach(([date, count]) => {
      dailyProposals.push({ date, count });
    });

    // Usage by category
    const usageByCategory = [
      { name: 'Auto-generated', value: 45 },
      { name: 'Manual', value: 35 },
      { name: 'Templates', value: 20 },
    ];

    // Platform distribution
    const platformDistribution = [
      { platform: 'Upwork', count: 12 },
      { platform: 'Freelancer', count: 8 },
      { platform: 'Direct', count: 5 },
    ];

    res.json({
      success: true,
      analytics: {
        dailyProposals: dailyProposals.slice(-30),
        usageByCategory,
        platformDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a refund request
 */
export const createRefundRequest = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const { subscriptionId, reason } = req.body;

    if (!subscriptionId || !reason || reason.trim().length === 0) {
      const error = new Error('Subscription ID and reason are required');
      error.statusCode = 400;
      throw error;
    }

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription || String(subscription.userId) !== userId) {
      const error = new Error('Subscription not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    // Check if activated at least once
    if (!subscription.activatedAt) {
      const error = new Error('Can only request refund for activated subscriptions');
      error.statusCode = 400;
      throw error;
    }

    // Calculate days since purchase
    const daysSince = Math.ceil(
      (new Date() - new Date(subscription.activatedAt)) / (1000 * 60 * 60 * 24)
    );

    if (daysSince > 5) {
      const error = new Error('Refund window expired (5 days from activation)');
      error.statusCode = 400;
      throw error;
    }

    // Check if refund already requested
    const existingRefund = await RefundRequest.findOne({
      subscriptionId,
      status: { $in: ['pending', 'approved', 'refunded'] },
    });

    if (existingRefund) {
      const error = new Error('Refund request already exists for this subscription');
      error.statusCode = 400;
      throw error;
    }

    // Create refund request
    const refundRequest = new RefundRequest({
      userId,
      subscriptionId,
      amount: subscription.plan?.monthlyPrice || 0,
      planName: subscription.plan?.name || 'Unknown',
      reason,
      daysSincePurchase: daysSince,
      purchaseDate: subscription.activatedAt,
    });

    await refundRequest.save();

    // Notify admin
    await notificationService.createNotification({
      title: 'New Refund Request',
      message: `Refund request received from ${subscription.userId} for ${subscription.plan?.name} plan ($${subscription.plan?.monthlyPrice})`,
      type: 'admin',
      relatedId: refundRequest._id,
    });

    res.json({
      success: true,
      message: 'Refund request submitted',
      refundRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user refund requests
 */
export const getUserRefundRequests = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const refundRequests = await RefundRequest.find({ userId })
      .populate('subscriptionId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      refundRequests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Decline a subscription plan
 */
export const declineSubscriptionPlan = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const { subscriptionId } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription || String(subscription.userId) !== userId) {
      const error = new Error('Subscription not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    // Update subscription status
    subscription.status = 'declined_by_user';
    subscription.declinedByUserAt = new Date();
    await subscription.save();

    // Cancel Stripe subscription if exists
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.del(subscription.stripeSubscriptionId, {
          invoice_now: false,
        });
      } catch (error) {
        console.error('Error cancelling Stripe subscription:', error);
      }
    }

    res.json({
      success: true,
      message: 'Plan declined successfully',
      subscription,
    });
  } catch (error) {
    next(error);
  }
};
