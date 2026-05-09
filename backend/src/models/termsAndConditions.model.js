import mongoose from 'mongoose';

const termsAndConditionsSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      unique: true,
      default: '1.0.0',
    },
    title: {
      type: String,
      required: true,
      default: 'Terms and Conditions',
    },
    content: {
      type: String,
      required: true,
      // This will contain the full T&C content in HTML or Markdown
    },
    violationRules: [
      {
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
      },
    ],
    suspensionPolicy: {
      warningThreshold: {
        type: Number,
        default: 1, // First violation triggers warning
      },
      suspensionThreshold: {
        type: Number,
        default: 3, // Third violation triggers suspension
      },
      warningCount: {
        type: Number,
        default: 2, // Number of warnings before suspension
      },
      suspensionDuration: {
        type: Number,
        default: 7, // Days
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: 'system',
    },
    lastUpdatedBy: {
      type: String,
      default: null,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const TermsAndConditions = mongoose.model(
  'TermsAndConditions',
  termsAndConditionsSchema
);

export default TermsAndConditions;
