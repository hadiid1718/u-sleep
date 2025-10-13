const WebhookLog = require('../models/Webhooks');
const stripe = require('stripe')

// Update the handleStripeWebhook function
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const startTime = Date.now();

  let event;
  let webhookLog;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('✅ Webhook verified:', event.type);

    // Create initial webhook log
    webhookLog = await WebhookLog.create({
      eventId: event.id,
      eventType: event.type,
      status: 'pending',
      data: event.data.object,
      metadata: {
        userId: event.data.object.metadata?.userId,
        plan: event.data.object.metadata?.plan,
        customerId: event.data.object.customer,
        subscriptionId: event.data.object.subscription
      }
    });

  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    
    // Log failed verification
    try {
      await WebhookLog.create({
        eventId: `failed_${Date.now()}`,
        eventType: 'verification_failed',
        status: 'failed',
        error: err.message,
        data: {}
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  try {
    switch (event.type) {
      // Checkout events
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object);
        break;

      case 'checkout.session.async_payment_succeeded':
        await handleAsyncPaymentSucceeded(event.data.object);
        break;

      case 'checkout.session.async_payment_failed':
        await handleAsyncPaymentFailed(event.data.object);
        break;

      // Subscription events
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      // Invoice events
      case 'invoice.created':
        await handleInvoiceCreated(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'invoice.finalized':
        await handleInvoiceFinalized(event.data.object);
        break;

      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event.data.object);
        break;

      // Payment Intent events
      case 'payment_intent.created':
        await handlePaymentIntentCreated(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      // Customer events
      case 'customer.created':
        await handleCustomerCreated(event.data.object);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object);
        break;

      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object);
        break;

      // Charge events
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object);
        break;

      case 'charge.failed':
        await handleChargeFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;

      // Refund events
      case 'refund.created':
        await handleRefundCreated(event.data.object);
        break;

      case 'refund.updated':
        await handleRefundUpdated(event.data.object);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    // Update webhook log with success
    const processingTime = Date.now() - startTime;
    webhookLog.status = 'success';
    webhookLog.processingTime = processingTime;
    await webhookLog.save();

    console.log(`✅ Webhook processed successfully in ${processingTime}ms`);

    res.json({ 
      received: true, 
      type: event.type,
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    console.error('❌ Webhook handler error:', error);

    // Update webhook log with failure
    webhookLog.status = 'failed';
    webhookLog.error = error.message;
    webhookLog.processingTime = Date.now() - startTime;
    await webhookLog.save();

    res.status(500).json({ 
      error: 'Webhook handler failed', 
      message: error.message 
    });
  }
};


exports.handleStats = async(req, res) => {
      try {    
    const [
      totalWebhooks,
      successfulWebhooks,
      failedWebhooks,
      recentWebhooks
    ] = await Promise.all([
      WebhookLog.countDocuments(),
      WebhookLog.countDocuments({ status: 'success' }),
      WebhookLog.countDocuments({ status: 'failed' }),
      WebhookLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('eventType status createdAt')
    ]);

    res.json({
      success: true,
      stats: {
        total: totalWebhooks,
        successful: successfulWebhooks,
        failed: failedWebhooks,
        successRate: totalWebhooks > 0 
          ? ((successfulWebhooks / totalWebhooks) * 100).toFixed(2) + '%' 
          : '0%',
        recent: recentWebhooks
      }
    });
  } catch (error) {
    console.error('Get webhook stats error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

exports.handleLogs = async(req, res) => {
      try {
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.eventType) filter.eventType = req.query.eventType;
    if (req.query.status) filter.status = req.query.status;

    const [logs, total] = await Promise.all([
      WebhookLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WebhookLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get webhook logs error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

exports.handleEvents = async(req, res) => {
     res.json({
    success: true,
    events: {
      checkout: [
        'checkout.session.completed',
        'checkout.session.expired',
        'checkout.session.async_payment_succeeded',
        'checkout.session.async_payment_failed'
      ],
      subscription: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'customer.subscription.trial_will_end'
      ],
      invoice: [
        'invoice.created',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'invoice.finalized',
        'invoice.upcoming'
      ],
      payment_intent: [
        'payment_intent.created',
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'payment_intent.canceled'
      ],
      customer: [
        'customer.created',
        'customer.updated',
        'customer.deleted'
      ],
      charge: [
        'charge.succeeded',
        'charge.failed',
        'charge.refunded',
        'charge.dispute.created'
      ],
      refund: [
        'refund.created',
        'refund.updated'
      ]
    },
    totalEvents: 28,
    documentation: 'https://stripe.com/docs/api/events/types'
  });
}

exports.handlewebRetry = async(req, res  )=> {
      try {
    const { webhookId } = req.params;

    const webhookLog = await WebhookLog.findById(webhookId);

    if (!webhookLog) {
      return res.status(404).json({ 
        success: false,
        error: 'Webhook log not found' 
      });
    }

    if (webhookLog.status !== 'failed') {
      return res.status(400).json({ 
        success: false,
        error: 'Can only retry failed webhooks' 
      });
    }

    // Retry the webhook by re-processing the event
    // This would call the appropriate handler based on eventType
    console.log(`Retrying webhook: ${webhookLog.eventType}`);

    webhookLog.retryCount = (webhookLog.retryCount || 0) + 1;
    webhookLog.lastRetryAt = new Date();
    await webhookLog.save();

    res.json({
      success: true,
      message: 'Webhook retry initiated',
      retryCount: webhookLog.retryCount
    });
  } catch (error) {
    console.error('Retry webhook error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

exports.handleDelete = async(req, res) => {
      try {
    const { webhookId } = req.params;

    const webhookLog = await WebhookLog.findByIdAndDelete(webhookId);

    if (!webhookLog) {
      return res.status(404).json({ 
        success: false,
        error: 'Webhook log not found' 
      });
    }

    res.json({
      success: true,
      message: 'Webhook log deleted successfully'
    });
  } catch (error) {
    console.error('Delete webhook log error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

exports.handleClearLogs = async(req,res) => {
      try {
    const { days = 30 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await WebhookLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted webhook logs older than ${days} days`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear webhook logs error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}


