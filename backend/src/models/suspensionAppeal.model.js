import mongoose from 'mongoose';

const suspensionAppealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    suspensionReason: {
      type: String,
      required: true,
    },
    violationCount: {
      type: Number,
      required: true,
    },
    suspendedAt: {
      type: Date,
      required: true,
    },
    appealMessage: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    appealsHistory: [
      {
        appealNumber: { type: Number, required: true },
        message: { type: String, required: true, maxlength: 2000 },
        submittedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['pending', 'reviewed', 'accepted', 'rejected'],
          default: 'pending',
        },
      },
    ],
    currentStatus: {
      type: String,
      enum: ['pending', 'under_review', 'accepted', 'rejected', 'resolved'],
      default: 'pending',
      index: true,
    },
    adminReview: {
      reviewedBy: {
        type: String,
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      adminResponse: {
        type: String,
        default: '',
        maxlength: 2000,
      },
      decision: {
        type: String,
        enum: ['lift_suspension', 'maintain_suspension', 'permanent_block'],
        default: null,
      },
      adminNotes: {
        type: String,
        default: '',
      },
    },
    contactInfo: {
      phone: {
        type: String,
        default: '',
      },
      preferredContact: {
        type: String,
        enum: ['email', 'phone'],
        default: 'email',
      },
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const SuspensionAppeal = mongoose.model(
  'SuspensionAppeal',
  suspensionAppealSchema
);

export default SuspensionAppeal;
