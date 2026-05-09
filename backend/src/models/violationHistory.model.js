import mongoose from 'mongoose';

const violationHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ruleId: {
      type: String,
      required: true,
      enum: [
        'spam_posting',
        'abusive_language',
        'fraudulent_activity',
        'plagiarism',
        'unauthorized_access',
        'multiple_accounts',
        'payment_fraud',
        'ip_violation',
        'fake_qualifications',
        'harassment',
      ],
    },
    ruleName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    violationNumber: {
      type: Number,
      required: true, // 1st, 2nd, 3rd violation, etc.
    },
    actionTaken: {
      type: String,
      enum: ['warning_sent', 'account_suspended'],
      required: true,
    },
    warningsSent: {
      inApp: {
        type: Boolean,
        default: false,
      },
      email: {
        type: Boolean,
        default: false,
      },
      warningMessage: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'appealed'],
      default: 'active',
    },
    evidence: {
      type: String,
      default: '', // Description of evidence or link to evidence
    },
    reportedBy: {
      type: String,
      default: 'system', // 'system', 'admin', or admin ID
    },
    adminNotes: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const ViolationHistory = mongoose.model(
  'ViolationHistory',
  violationHistorySchema
);

export default ViolationHistory;
