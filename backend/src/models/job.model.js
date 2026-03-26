import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    // Upwork Job Identifiers
    upworkJobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    upworkUrl: {
      type: String,
      required: true,
    },

    // Job Basic Info
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
    },

    // Job Details
    category: {
      type: String,
    },
    skills: {
      type: [String],
      default: [],
    },
    proposalsCount: {
      type: Number,
      default: 0,
    },
    duration: {
      type: String,
    },
    workloadHoursPerWeek: {
      type: Number,
    },
    postedDate: {
      type: Date,
    },

    // Budget Info
    budgetType: {
      type: String,
      enum: ['fixed', 'hourly'],
      required: true,
    },
    budget: {
      amount: Number,
      currency: { type: String, default: 'USD' },
    },
    hourlyRate: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' },
    },

    // Client Information
    clientInfo: {
      name: String,
      rating: Number,
      totalReviews: Number,
      totalSpent: Number,
      jobsPosted: Number,
      paymentVerified: { type: Boolean, default: false },
      hireRate: Number,
      country: String,
      totalHires: Number,
    },

    // AI Analysis & Matching
    aiAnalysis: {
      matchScore: { type: Number, min: 0, max: 100 },
      recommendation: String,
      greenFlags: [String],
      redFlags: [String],
      reasoning: String,
    },

    // User Interest Tracking
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    matchStatus: {
      type: String,
      enum: ['pending', 'matched', 'rejected', 'archived'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
    },

    // Search Cache Metadata
    searchMetadata: {
      keywords: {
        type: [String],
        default: [],
      },
      signature: {
        type: String,
        index: true,
      },
      source: {
        type: String,
      },
    },

    // Cache & Performance
    isCached: { type: Boolean, default: false },
    cacheExpiry: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-expire cache after 24 hours
jobSchema.index({ cacheExpiry: 1 }, { expireAfterSeconds: 0 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
