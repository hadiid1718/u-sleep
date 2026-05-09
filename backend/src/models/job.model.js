import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    // Upwork Job Identifiers
    upworkJobId: {
      type: String,
      required: false,
      index: true,
    },
    freelancerJobId: {
      type: String,
      required: false,
      index: true,
    },
    source: {
      type: String,
      enum: ['upwork_api', 'freelancer_api'],
      default: 'upwork_api',
      index: true,
    },
    sourceJobId: {
      type: String,
      default: null,
    },
    upworkUrl: {
      type: String,
      required: false,
    },
    freelancerUrl: {
      type: String,
      required: false,
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
    descriptionLanguage: {
      type: String,
      default: null,
    },
    shortDescription: {
      type: String,
    },
    translatedDescription: {
      type: String,
      default: null,
    },
    translatedDescriptionLanguage: {
      type: String,
      default: null,
    },
    translationProvider: {
      type: String,
      default: null,
    },
    descriptionTranslatedAt: {
      type: Date,
      default: null,
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

// Compound unique indexes to allow the same platform job id for different users
// while preventing duplicates for the same user.
// Create two sparse unique indexes: one for upwork jobs, one for freelancer jobs.
jobSchema.index({ upworkJobId: 1, userId: 1 }, { unique: true, sparse: true });
jobSchema.index(
  { freelancerJobId: 1, userId: 1 },
  { unique: true, sparse: true }
);

const Job = mongoose.model('Job', jobSchema);

export default Job;
