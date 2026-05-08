import mongoose from 'mongoose';

const refundRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'refunded'],
      default: 'pending',
    },
    daysSincePurchase: {
      type: Number,
      required: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    declinedReason: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    stripeRefundId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for querying pending refunds
refundRequestSchema.index({ status: 1, userId: 1 });
refundRequestSchema.index({ createdAt: -1 });

export default mongoose.model('RefundRequest', refundRequestSchema);
