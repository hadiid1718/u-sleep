import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['starter', 'pro', 'agency'],
      required: true,
      default: 'starter',
    },
    status: {
      type: String,
      enum: [
        'trialing',
        'active',
        'past_due',
        'canceled',
        'incomplete',
        'incomplete_expired',
        'unpaid',
        'pending_approval',
        'declined',
        'declined_by_user',
        'cancelled',
      ],
      default: 'pending_approval',
      index: true,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    autoSendEnabled: {
      type: Boolean,
      default: false,
    },
    platformLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    proposalLimit: {
      type: Number,
      default: 30,
    },
    // Admin approval fields
    adminApprovedAt: {
      type: Date,
      default: null,
    },
    adminApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    declinedAt: {
      type: Date,
      default: null,
    },
    declinedReason: {
      type: String,
      default: null,
    },
    declinedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    declinedByUserAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    nextBillingDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
