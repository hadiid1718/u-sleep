const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending',
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  error: {
    type: String
  },
  processingTime: {
    type: Number // in milliseconds
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: {
    type: Date
  },
  metadata: {
    userId: String,
    plan: String,
    customerId: String,
    subscriptionId: String
  }
}, {
  timestamps: true
});

// Index for better query performance
webhookLogSchema.index({ createdAt: -1 });
webhookLogSchema.index({ eventType: 1, status: 1 });

// Auto-delete logs older than 90 days
webhookLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('WebhookLog', webhookLogSchema);