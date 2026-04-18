import mongoose from 'mongoose';

const usageRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orgId: {
      type: String,
      default: null,
      trim: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true,
    },
    aiProposalsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    autoSendUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    platformsConnected: {
      type: [String],
      enum: ['upwork', 'freelancer'],
      default: [],
    },
  },
  { timestamps: true }
);

usageRecordSchema.index({ userId: 1, month: 1 }, { unique: true });

const UsageRecord = mongoose.model('UsageRecord', usageRecordSchema);

export default UsageRecord;
