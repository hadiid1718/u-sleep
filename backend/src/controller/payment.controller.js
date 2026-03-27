import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, FRONTEND_URL, APP_URL } from '../config/env.js';
import User from '../models/user.model.js';
import Payment from '../models/payment.model.js';
import Product from '../models/product.model.js';
import { getEffectiveAnnualPrice } from '../utils/pricing.js';
import workflowClient from '../config/upstash.js';

const stripe = new Stripe(STRIPE_SECRET_KEY);

const COINS_PER_SUBSCRIPTION = 30000;

/**
 * POST /api/v1/payments/create-checkout-session
 * Create a Stripe Checkout session
 */
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { plan, frequency = 'monthly' } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      const error = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    if (!plan || !['manual', 'auto'].includes(plan)) {
      const error = new Error('Invalid plan. Must be "manual" or "auto"');
      error.statusCode = 400;
      throw error;
    }

    if (!['monthly', 'annually'].includes(frequency)) {
      const error = new Error(
        'Invalid frequency. Must be "monthly" or "annually"'
      );
      error.statusCode = 400;
      throw error;
    }

    // Fetch product pricing from DB
    const product = await Product.findOne({ key: plan, isActive: true });
    if (!product) {
      const error = new Error(`Product "${plan}" not found or is inactive`);
      error.statusCode = 404;
      throw error;
    }

    const amount =
      frequency === 'annually'
        ? getEffectiveAnnualPrice(product)
        : product.monthlyPrice;

    if (!amount || amount <= 0) {
      const error = new Error(
        `Pricing not configured for "${plan}" (${frequency}). Please contact support.`
      );
      error.statusCode = 400;
      throw error;
    }

    const _periodLabel = frequency === 'annually' ? '/year' : '/month';

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId.toString(),
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID to user
      await User.findByIdAndUpdate(userId, {
        'subscription.stripeCustomerId': stripeCustomerId,
      });
    }

    const planInfo = product;

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planInfo.name} (${frequency})`,
              description: `${planInfo.name} — ${frequency} subscription`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment/cancel`,
      metadata: {
        userId: userId.toString(),
        plan,
        frequency,
      },
    });

    // Create pending payment record
    await Payment.create({
      userId,
      stripeSessionId: session.id,
      plan,
      frequency,
      amount,
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payments/webhook
 * Stripe webhook handler
 */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await handleCheckoutComplete(session);
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object;
      await handleCheckoutExpired(session);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};

/**
 * Handle successful checkout
 */
async function handleCheckoutComplete(session) {
  try {
    const { userId, plan, frequency = 'monthly' } = session.metadata;

    // Calculate expiration based on frequency
    const durationMs =
      frequency === 'annually'
        ? 365 * 24 * 60 * 60 * 1000 // 365 days
        : 30 * 24 * 60 * 60 * 1000; // 30 days

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        status: 'completed',
        stripePaymentIntentId: session.payment_intent,
        coinsAwarded: COINS_PER_SUBSCRIPTION,
      },
      { new: true }
    );

    if (!payment) {
      console.error('Payment record not found for session:', session.id);
      return;
    }

    // Update user subscription and coin balance atomically
    await User.findByIdAndUpdate(userId, {
      'subscription.plan': plan,
      'subscription.frequency': frequency,
      'subscription.status': 'active',
      'subscription.subscribedAt': new Date(),
      'subscription.expiresAt': new Date(Date.now() + durationMs),
      $inc: { coins: COINS_PER_SUBSCRIPTION },
      $push: {
        coinHistory: {
          amount: COINS_PER_SUBSCRIPTION,
          type: 'credit',
          reason: `Subscription payment (${plan} - ${frequency})`,
          createdAt: new Date(),
        },
      },
    });

    // Trigger Upstash subscription expiry reminder workflow
    try {
      const appUrl = APP_URL || `http://localhost:${process.env.PORT || 5500}`;
      await workflowClient.trigger({
        url: `${appUrl}/api/v1/workflows/subscription`,
        body: { userId: userId.toString() },
      });
      console.log(
        `Subscription reminder workflow triggered for user ${userId}`
      );
    } catch (wfError) {
      // Don't fail the payment if workflow trigger fails
      console.error(
        'Failed to trigger subscription workflow:',
        wfError.message
      );
    }

    console.log(
      `Payment completed for user ${userId}, plan: ${plan}, frequency: ${frequency}`
    );
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

/**
 * Handle expired/cancelled checkout
 */
async function handleCheckoutExpired(session) {
  try {
    await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      { status: 'cancelled' }
    );
  } catch (error) {
    console.error('Error handling checkout expiration:', error);
  }
}

/**
 * GET /api/v1/payments/verify-session/:sessionId
 * Verify a checkout session (for success page)
 */
export const verifySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!sessionId) {
      const error = new Error('Session ID is required');
      error.statusCode = 400;
      throw error;
    }

    // Find the payment record
    const payment = await Payment.findOne({
      stripeSessionId: sessionId,
      userId,
    });

    if (!payment) {
      const error = new Error('Payment not found');
      error.statusCode = 404;
      throw error;
    }

    // If still pending, check with Stripe
    if (payment.status === 'pending') {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid') {
        // Process the payment if webhook hasn't already
        await handleCheckoutComplete(session);

        // Refresh payment record
        const updatedPayment = await Payment.findOne({
          stripeSessionId: sessionId,
        });

        const user = await User.findById(userId).select('subscription');

        return res.status(200).json({
          success: true,
          data: {
            payment: updatedPayment,
            subscription: user.subscription,
          },
        });
      }
    }

    const user = await User.findById(userId).select('subscription');

    res.status(200).json({
      success: true,
      data: {
        payment,
        subscription: user?.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payments/my-payments
 * Get current user's payment history
 */
export const getMyPayments = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payments/revenue-stats  (Admin)
 * Get revenue statistics for admin dashboard
 */
/**
 * GET /api/v1/payments/coin-balance
 * Get current user's coin balance and history
 */
export const getCoinBalance = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const user = await User.findById(userId).select(
      'coins coinHistory subscription'
    );
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        coins: user.coins,
        coinHistory: user.coinHistory,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueStats = async (req, res, next) => {
  try {
    const { subPage = 1, subLimit = 2, payPage = 1, payLimit = 2 } = req.query;
    const subSkip = (parseInt(subPage) - 1) * parseInt(subLimit);
    const paySkip = (parseInt(payPage) - 1) * parseInt(payLimit);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month revenue
    const currentMonthPayments = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    // Last month revenue
    const lastMonthPayments = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const currentRevenue = (currentMonthPayments[0]?.total || 0) / 100;
    const lastRevenue = (lastMonthPayments[0]?.total || 0) / 100;
    const revenueChange =
      lastRevenue > 0
        ? (((currentRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1)
        : currentRevenue > 0
          ? '100'
          : '0';

    // Revenue by frequency (monthly vs annually subscriptions)
    const frequencyRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$frequency',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlyFreqData = frequencyRevenue.find(f => f._id === 'monthly') || {
      total: 0,
      count: 0,
    };
    const annualFreqData = frequencyRevenue.find(f => f._id === 'annually') || {
      total: 0,
      count: 0,
    };
    const monthlySubscriptionRevenue = monthlyFreqData.total / 100;
    const annualSubscriptionRevenue = annualFreqData.total / 100;

    // Active subscriptions
    const activeSubscriptions = await User.countDocuments({
      'subscription.status': 'active',
    });

    // New subscriptions this month
    const newSubscriptions = await Payment.countDocuments({
      status: 'completed',
      createdAt: { $gte: startOfMonth },
    });
    const lastMonthSubs = await Payment.countDocuments({
      status: 'completed',
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const subChange =
      lastMonthSubs > 0
        ? (((newSubscriptions - lastMonthSubs) / lastMonthSubs) * 100).toFixed(
          1
        )
        : newSubscriptions > 0
          ? '100'
          : '0';

    // Total revenue all time
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    // Subscription breakdown by plan (with pagination)
    const planBreakdownAll = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$plan',
          users: { $addToSet: '$userId' },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          plan: '$_id',
          users: { $size: '$users' },
          revenue: { $divide: ['$revenue', 100] },
          count: 1,
        },
      },
    ]);
    const totalPlanBreakdown = planBreakdownAll.length;
    const planBreakdown = planBreakdownAll.slice(
      subSkip,
      subSkip + parseInt(subLimit)
    );

    // Recent payments (with pagination)
    const totalRecentPayments = await Payment.countDocuments({
      status: 'completed',
    });
    const recentPayments = await Payment.find({ status: 'completed' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(paySkip)
      .limit(parseInt(payLimit));

    // Cancelled payments count
    const cancelledPayments = await Payment.countDocuments({
      status: 'cancelled',
    });
    const totalPayments = await Payment.countDocuments();
    const churnRate =
      totalPayments > 0
        ? ((cancelledPayments / totalPayments) * 100).toFixed(1)
        : '0';

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          monthlyRevenue: `$${monthlySubscriptionRevenue.toFixed(2)}`,
          monthlyRevenueCount: monthlyFreqData.count,
          annualRevenue: `$${annualSubscriptionRevenue.toFixed(2)}`,
          annualRevenueCount: annualFreqData.count,
          calendarMonthRevenue: `$${currentRevenue.toFixed(2)}`,
          revenueChange: `${revenueChange}%`,
          newSubscriptions,
          subChange: `${subChange}%`,
          activeSubscriptions,
          churnRate: `${churnRate}%`,
          totalRevenue: `$${((totalRevenue[0]?.total || 0) / 100).toFixed(2)}`,
          totalTransactions: totalRevenue[0]?.count || 0,
        },
        planBreakdown,
        planBreakdownPagination: {
          total: totalPlanBreakdown,
          page: parseInt(subPage),
          limit: parseInt(subLimit),
          pages: Math.ceil(totalPlanBreakdown / parseInt(subLimit)),
        },
        recentPayments,
        recentPaymentsPagination: {
          total: totalRecentPayments,
          page: parseInt(payPage),
          limit: parseInt(payLimit),
          pages: Math.ceil(totalRecentPayments / parseInt(payLimit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
