import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema(
  {
    // Relationship
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    upworkJobId: {
      type: String,
      required: true,
    },

    // Proposal Content
    content: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      enum: ['original', 'upgraded_with_case_study'],
      default: 'original',
    },

    // Case Study (if upgraded)
    caseStudy: {
      title: String,
      description: String,
      results: String,
    },

    // Proposal Status Workflow
    status: {
      type: String,
      enum: [
        'draft',
        'sent',
        'received',
        'viewed',
        'accepted',
        'rejected',
        'withdrawn',
      ],
      default: 'draft',
      index: true,
    },

    // Status Timeline
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            'draft',
            'sent',
            'received',
            'viewed',
            'accepted',
            'rejected',
            'withdrawn',
          ],
        },
        timestamp: { type: Date, default: Date.now },
        notes: String,
      },
    ],

    // Client Engagement
    clientResponse: {
      type: String,
    },
    clientFeedback: {
      type: String,
    },
    responseDate: Date,
    viewedDate: Date,

    // Proposal Metadata
    bidAmount: Number,
    estimatedDuration: String,
    deliveryDate: Date,

    // AI Generation Info
    aiService: {
      type: String,
      enum: ['openai', 'gemini'],
    },
    aiModel: String,
    generatedAt: Date,

    // User Feedback
    userRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    userFeedback: String,

    // Performance Metrics
    interviewRate: { type: Boolean, default: false },
    hireProbability: Number,

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index for efficient querying
proposalSchema.index({ userId: 1, jobId: 1 }, { unique: true });
proposalSchema.index({ userId: 1, status: 1 });
proposalSchema.index({ upworkJobId: 1, userId: 1 });

const Proposal = mongoose.model('Proposal', proposalSchema);

export default Proposal;
