import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'job_alert',
  'proposal_sent',
  'proposal_pending',
  'proposal_rejected',
  'billing_renewal',
  'billing_success',
  'billing_failed',
  'billing_plan_change',
  'billing_trial_expiry',
  'billing_usage_limit',
  'admin_case_update',
];

export const NOTIFICATION_GROUPS = [
  'new_jobs',
  'proposals',
  'billing',
  'account',
];
export const NOTIFICATION_PRIORITIES = ['high', 'medium', 'low'];

const ctaSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const billingMetaSchema = new mongoose.Schema(
  {
    plan: { type: String, default: null },
    amount: { type: Number, default: null },
    currency: { type: String, default: 'USD' },
    dueDate: { type: Date, default: null },
    invoiceUrl: { type: String, default: null },
  },
  { _id: false }
);

const emailMetaSchema = new mongoose.Schema(
  {
    forced: { type: Boolean, default: false },
    sentAt: { type: Date, default: null },
    digestStatus: {
      type: String,
      enum: ['none', 'pending', 'sent', 'failed'],
      default: 'none',
    },
    digestWindow: {
      type: String,
      enum: ['daily', 'weekly', null],
      default: null,
    },
    lastError: { type: String, default: null },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    group: {
      type: String,
      enum: NOTIFICATION_GROUPS,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    platform: {
      type: String,
      default: 'N/A',
      trim: true,
      maxlength: 32,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      required: true,
      index: true,
    },
    icon: {
      type: String,
      default: 'bell',
      trim: true,
      maxlength: 32,
    },
    statusBadge: {
      type: String,
      default: null,
      trim: true,
      maxlength: 64,
    },
    cta: {
      type: [ctaSchema],
      default: [],
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    billingMeta: {
      type: billingMetaSchema,
      default: null,
    },
    emailMeta: {
      type: emailMetaSchema,
      default: () => ({}),
    },
    eventKey: {
      type: String,
      default: undefined,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, timestamp: -1 });
notificationSchema.index({ userId: 1, group: 1, timestamp: -1 });
notificationSchema.index(
  { userId: 1, eventKey: 1 },
  {
    unique: true,
    sparse: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
