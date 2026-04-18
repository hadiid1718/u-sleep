import mongoose from 'mongoose';

const billingPlanSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      enum: ['starter', 'pro', 'agency'],
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    stripePriceId: {
      type: String,
      default: null,
      trim: true,
    },
    proposalLimit: {
      type: Number,
      required: true,
    },
    platformLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    autoSendEnabled: {
      type: Boolean,
      default: false,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const BillingPlan = mongoose.model('BillingPlan', billingPlanSchema);

export default BillingPlan;
