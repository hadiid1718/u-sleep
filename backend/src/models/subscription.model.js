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
      ],
      default: 'active',
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
  },
  { timestamps: true }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
