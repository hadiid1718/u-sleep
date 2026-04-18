import { randomUUID } from 'crypto';
import Subscription from '../models/subscription.model.js';
import UsageRecord from '../models/usageRecord.model.js';
import BillingPlan from '../models/billingPlan.model.js';
import {
  stripe,
  getPriceIdByPlan,
  getPlanByPriceId,
  CLIENT_APP_URL,
} from '../config/stripe.js';
import { STRIPE_WEBHOOK_SECRET } from '../config/env.js';
import {
  PLAN_CONFIG,
  ACTIVE_SUBSCRIPTION_STATUSES,
  getPlanConfig,
  nextMonthResetDate,
  toMonthKey,
  isUnlimitedPlan,
} from '../utils/subscriptionPlans.js';

const getAuthUserId = req =>
  String(
    req.user?._id || req.user?.id || req.admin?._id || req.admin?.id || ''
  );

const toDateFromUnix = unixTimestamp =>
  unixTimestamp ? new Date(unixTimestamp * 1000) : null;

const makeIdempotencyKey = (prefix, req, suffix = '') => {
  const fromHeader = req.headers['idempotency-key'];
  if (fromHeader) return String(fromHeader);

  const userId = getAuthUserId(req) || 'anonymous';
  return `${prefix}-${userId}-${suffix || randomUUID()}`;
};

const toPlanPayload = (planId, stripePriceId) => {
  const plan = getPlanConfig(planId);
  if (!plan) return null;

  return {
    planId,
    name: plan.name,
    monthlyPrice: plan.monthlyPrice,
    proposalLimit: plan.proposalLimit,
    platformLimit: plan.platformLimit,
    autoSendEnabled: plan.autoSendEnabled,
    features: plan.features,
    stripePriceId: stripePriceId || null,
  };
};

const getStripePriceIdFromSubscription = stripeSubscription =>
  stripeSubscription?.items?.data?.[0]?.price?.id || null;

const resolvePlanFromSubscription = stripeSubscription => {
  const priceId = getStripePriceIdFromSubscription(stripeSubscription);
  const planFromPrice = getPlanByPriceId(priceId);
  return {
    planId: planFromPrice,
    priceId,
  };
};

const upsertSubscriptionForUser = async ({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  planId,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}) => {
  const plan = getPlanConfig(planId);
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }

  return Subscription.findOneAndUpdate(
    { userId },
    {
      $set: {
        stripeCustomerId,
        stripeSubscriptionId,
        plan: planId,
        status,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        autoSendEnabled: plan.autoSendEnabled,
        platformLimit: plan.platformLimit,
        proposalLimit: plan.proposalLimit,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const createCheckoutSession = async (req, res, next) => {
  try {
    const authUserId = getAuthUserId(req);
    if (!authUserId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const { planId, userId } = req.body;

    if (!planId || !PLAN_CONFIG[planId]) {
      const error = new Error(
        'Invalid planId. Expected one of starter, pro, agency.'
      );
      error.statusCode = 400;
      throw error;
    }

    if (userId && String(userId) !== authUserId) {
      const error = new Error(
        'You can only create a checkout session for your own account.'
      );
      error.statusCode = 403;
      throw error;
    }

    const stripePriceId = getPriceIdByPlan(planId);
    if (!stripePriceId) {
      const error = new Error(`Missing Stripe price id for plan ${planId}.`);
      error.statusCode = 500;
      throw error;
    }

    const existingSubscription = await Subscription.findOne({
      userId: authUserId,
    });

    let stripeCustomerId = existingSubscription?.stripeCustomerId || null;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create(
        {
          metadata: {
            userId: authUserId,
          },
        },
        {
          idempotencyKey: makeIdempotencyKey(
            'stripe-customer-create',
            req,
            planId
          ),
        }
      );
      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        success_url: `${CLIENT_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CLIENT_APP_URL}/billing/cancelled`,
        client_reference_id: authUserId,
        metadata: {
          userId: authUserId,
          planId,
        },
      },
      {
        idempotencyKey: makeIdempotencyKey(
          'stripe-checkout-session',
          req,
          `${planId}-${authUserId}`
        ),
      }
    );

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        checkoutUrl: session.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createPortalSession = async (req, res, next) => {
  try {
    const authUserId = getAuthUserId(req);
    if (!authUserId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const subscription = await Subscription.findOne({ userId: authUserId });

    if (!subscription?.stripeCustomerId) {
      const error = new Error('No Stripe customer found for this user.');
      error.statusCode = 404;
      throw error;
    }

    const portalSession = await stripe.billingPortal.sessions.create(
      {
        customer: subscription.stripeCustomerId,
        return_url: `${CLIENT_APP_URL}/billing`,
      },
      {
        idempotencyKey: makeIdempotencyKey(
          'stripe-portal-session',
          req,
          authUserId
        ),
      }
    );

    res.status(200).json({
      success: true,
      data: {
        url: portalSession.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (req, res, next) => {
  try {
    const authUserId = getAuthUserId(req);
    if (!authUserId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const subscription = await Subscription.findOne({
      userId: authUserId,
    }).lean();

    const month = toMonthKey();
    const usage = await UsageRecord.findOne({
      userId: authUserId,
      month,
    }).lean();

    const active =
      subscription &&
      ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status);

    const planConfig = subscription ? getPlanConfig(subscription.plan) : null;
    const proposalLimit =
      subscription?.proposalLimit ?? planConfig?.proposalLimit ?? 0;
    const proposalsUsed = usage?.aiProposalsUsed || 0;
    const proposalsRemaining = isUnlimitedPlan(proposalLimit)
      ? null
      : Math.max(0, proposalLimit - proposalsUsed);

    const nextReset = nextMonthResetDate();

    res.status(200).json({
      success: true,
      data: {
        plan: subscription?.plan || null,
        status: subscription?.status || 'inactive',
        isActive: Boolean(active),
        currentPeriodEnd: subscription?.currentPeriodEnd || null,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
        limits: {
          proposalLimit,
          platformLimit:
            subscription?.platformLimit ?? planConfig?.platformLimit ?? 0,
          autoSendEnabled:
            subscription?.autoSendEnabled ??
            planConfig?.autoSendEnabled ??
            false,
        },
        usage: {
          month,
          aiProposalsUsed: proposalsUsed,
          autoSendUsed: usage?.autoSendUsed || 0,
          platformsConnected: usage?.platformsConnected || [],
        },
        proposalsRemaining,
        nextResetDate: nextReset,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPlans = async (req, res, next) => {
  try {
    const dbPlans = await BillingPlan.find({ isActive: true })
      .sort({ monthlyPrice: 1 })
      .lean();

    if (dbPlans.length > 0) {
      return res.status(200).json({
        success: true,
        data: dbPlans.map(plan => ({
          planId: plan.planId,
          name: plan.name,
          monthlyPrice: plan.monthlyPrice,
          stripePriceId: plan.stripePriceId,
          proposalLimit: plan.proposalLimit,
          platformLimit: plan.platformLimit,
          autoSendEnabled: plan.autoSendEnabled,
          features: plan.features,
        })),
      });
    }

    const fallbackPlans = Object.keys(PLAN_CONFIG)
      .map(planId => toPlanPayload(planId, getPriceIdByPlan(planId)))
      .filter(Boolean)
      .sort((a, b) => a.monthlyPrice - b.monthlyPrice);

    res.status(200).json({ success: true, data: fallbackPlans });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const authUserId = getAuthUserId(req);
    if (!authUserId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const subscription = await Subscription.findOne({ userId: authUserId });
    if (!subscription?.stripeSubscriptionId) {
      const error = new Error(
        'No active Stripe subscription found for this user.'
      );
      error.statusCode = 404;
      throw error;
    }

    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      },
      {
        idempotencyKey: makeIdempotencyKey(
          'stripe-cancel-subscription',
          req,
          subscription.stripeSubscriptionId
        ),
      }
    );

    subscription.cancelAtPeriodEnd = true;
    subscription.status = stripeSubscription.status;
    subscription.currentPeriodEnd = toDateFromUnix(
      stripeSubscription.current_period_end
    );
    await subscription.save();

    res.status(200).json({
      success: true,
      message:
        'Subscription will be cancelled at the end of the billing period.',
      data: {
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error) {
    next(error);
  }
};

const handleCheckoutSessionCompleted = async event => {
  const session = event.data.object;

  if (session.mode !== 'subscription' || !session.subscription) {
    return;
  }

  const userId = String(
    session.client_reference_id || session.metadata?.userId || ''
  );
  if (!userId) return;

  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription
  );
  const { planId } = resolvePlanFromSubscription(stripeSubscription);

  if (!planId) return;

  await upsertSubscriptionForUser({
    userId,
    stripeCustomerId: session.customer || stripeSubscription.customer,
    stripeSubscriptionId: stripeSubscription.id,
    planId,
    status: stripeSubscription.status,
    currentPeriodEnd: toDateFromUnix(stripeSubscription.current_period_end),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
  });
};

const handleCustomerSubscriptionUpdated = async event => {
  const stripeSubscription = event.data.object;

  const { planId } = resolvePlanFromSubscription(stripeSubscription);
  if (!planId) return;

  const existing = await Subscription.findOne({
    $or: [
      { stripeSubscriptionId: stripeSubscription.id },
      { stripeCustomerId: stripeSubscription.customer },
    ],
  });

  if (!existing) return;

  await upsertSubscriptionForUser({
    userId: existing.userId,
    stripeCustomerId: stripeSubscription.customer,
    stripeSubscriptionId: stripeSubscription.id,
    planId,
    status: stripeSubscription.status,
    currentPeriodEnd: toDateFromUnix(stripeSubscription.current_period_end),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
  });
};

const handleCustomerSubscriptionDeleted = async event => {
  const stripeSubscription = event.data.object;

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: stripeSubscription.id },
    {
      $set: {
        status: 'canceled',
        cancelAtPeriodEnd: false,
        autoSendEnabled: false,
        proposalLimit: 0,
      },
    }
  );
};

const handleInvoicePaymentFailed = async event => {
  const invoice = event.data.object;
  const stripeSubscriptionId = invoice.subscription;

  if (!stripeSubscriptionId) return;

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    {
      $set: {
        status: 'past_due',
      },
    }
  );
};

const monthFromInvoice = invoice => {
  const lineStart = invoice?.lines?.data?.[0]?.period?.start;
  const periodStart = lineStart || invoice?.period_start;
  if (periodStart) {
    return toMonthKey(new Date(periodStart * 1000));
  }
  return toMonthKey();
};

const handleInvoicePaymentSucceeded = async event => {
  const invoice = event.data.object;
  const stripeSubscriptionId = invoice.subscription;
  const stripeCustomerId = invoice.customer;

  const subscription = await Subscription.findOne({
    $or: [{ stripeSubscriptionId }, { stripeCustomerId }],
  });

  if (!subscription) return;

  const month = monthFromInvoice(invoice);

  await UsageRecord.findOneAndUpdate(
    { userId: subscription.userId, month },
    {
      $set: {
        aiProposalsUsed: 0,
        autoSendUsed: 0,
        platformsConnected: [],
      },
      $setOnInsert: {
        orgId: null,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!STRIPE_WEBHOOK_SECRET) {
    return res
      .status(500)
      .json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' });
  }

  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).json({
      error: `Webhook signature verification failed: ${error.message}`,
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;
      case 'customer.subscription.updated':
        await handleCustomerSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(event);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event);
        break;
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || 'Webhook handling failed' });
  }
};
