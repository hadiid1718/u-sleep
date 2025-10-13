
// ==========================================
// 4. controllers/paymentController.js
// ==========================================
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const UsageRecord = require('../models/UserRecord');

// Price configurations
const PRICING_CONFIG = {
  manual: {
    name: 'Manual Job Responding',
    price: 5000, // $50.00 in cents
    currency: 'usd',
    type: 'subscription',
    interval: 'month'
  },
  auto: {
    name: 'Auto Responder',
    price: 50, // $0.50 in cents
    currency: 'usd',
    type: 'usage_based',
    interval: 'month',
    initialCredits: 20 // $10 worth of credits
  }
};

// Create Checkout Session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { plan, userId, email } = req.body;

    // Validate plan
    if (!plan || !PRICING_CONFIG[plan]) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid plan selected' 
      });
    }

    // Validate user
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID is required' 
      });
    }

    const planConfig = PRICING_CONFIG[plan];
    let sessionConfig;

    if (plan === 'manual') {
      // Subscription-based pricing
      sessionConfig = {
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: planConfig.currency,
              product_data: {
                name: planConfig.name,
                description: 'Job hunting, AI responses, and prospect connections',
              },
              unit_amount: planConfig.price,
              recurring: {
                interval: planConfig.interval,
              },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            userId: userId,
            plan: plan
          }
        }
      };
    } else if (plan === 'auto') {
      // Usage-based pricing - Initial payment for credits
      sessionConfig = {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: planConfig.currency,
              product_data: {
                name: `${planConfig.name} - Initial Credits`,
                description: `Pay-per-response model ($0.50 per response) - ${planConfig.initialCredits} responses included`,
              },
              unit_amount: planConfig.price * planConfig.initialCredits,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: {
            userId: userId,
            plan: plan,
            credits: planConfig.initialCredits
          }
        }
      };
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      ...sessionConfig,
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      customer_email: email,
      metadata: {
        userId: userId,
        plan: plan,
      },
    });

    res.json({ 
      success: true,
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Verify Payment Session
exports.verifySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      success: true,
      status: session.payment_status,
      customerEmail: session.customer_email,
      plan: session.metadata.plan,
      customerId: session.customer
    });

  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get Subscription Details
exports.getSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await Subscription.findOne({ 
      userId,
      status: { $in: ['active', 'trialing'] }
    });

    if (!subscription) {
      return res.status(404).json({ 
        success: false,
        error: 'No active subscription found' 
      });
    }

    res.json({
      success: true,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        usageCount: subscription.usageCount,
        credits: subscription.credits
      }
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Record Usage for Auto Plan
exports.recordUsage = async (req, res) => {
  try {
    const { userId, quantity = 1, description } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID required' 
      });
    }

    // Find active subscription
    const subscription = await Subscription.findOne({ 
      userId,
      plan: 'auto',
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({ 
        success: false,
        error: 'No active auto plan subscription found' 
      });
    }

    // Check if user has enough credits
    if (subscription.credits < quantity) {
      return res.status(402).json({ 
        success: false,
        error: 'Insufficient credits. Please add more credits.',
        creditsRemaining: subscription.credits
      });
    }

    // Deduct credits
    subscription.credits -= quantity;
    subscription.usageCount += quantity;
    await subscription.save();

    // Create usage record
    const usageRecord = await UsageRecord.create({
      subscriptionId: subscription._id,
      userId,
      quantity,
      description
    });

    // If Stripe subscription exists, report usage
    if (subscription.stripeSubscriptionItemId) {
      const stripeUsageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscription.stripeSubscriptionItemId,
        {
          quantity: quantity,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        }
      );
      
      usageRecord.stripeUsageRecordId = stripeUsageRecord.id;
      await usageRecord.save();
    }

    res.json({ 
      success: true,
      usageRecord,
      creditsRemaining: subscription.credits
    });

  } catch (error) {
    console.error('Usage recording error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Add Credits for Auto Plan
exports.addCredits = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID and amount required' 
      });
    }

    // Calculate credits (amount in dollars / 0.50)
    const credits = Math.floor(amount / 0.50);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        credits,
        type: 'credit_topup'
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      credits
    });

  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Cancel Subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.body;

    const subscription = await Subscription.findOne({ 
      userId,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({ 
        success: false,
        error: 'No active subscription found' 
      });
    }

    // Cancel at period end
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );
    }

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period'
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Create Customer Portal Session
exports.createPortalSession = async (req, res) => {
  try {
    const { userId } = req.body;

    const subscription = await Subscription.findOne({ userId });

    if (!subscription || !subscription.stripeCustomerId) {
      return res.status(404).json({ 
        success: false,
        error: 'No customer found' 
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({ 
      success: true,
      url: portalSession.url 
    });

  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get Payment History
exports.getPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      payments
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get Usage History
exports.getUsageHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const usageRecords = await UsageRecord.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      usageRecords
    });

  } catch (error) {
    console.error('Get usage history error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

