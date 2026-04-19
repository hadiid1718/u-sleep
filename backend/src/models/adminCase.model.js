import mongoose from 'mongoose';

const adminCaseSchema = new mongoose.Schema(
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
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'rejected'],
      default: 'open',
      index: true,
    },
    action: {
      type: String,
      enum: ['none', 'suspend', 'unsuspend', 'block'],
      default: 'none',
    },
    resolution: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1200,
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1200,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const AdminCase = mongoose.model('AdminCase', adminCaseSchema);

export default AdminCase;
