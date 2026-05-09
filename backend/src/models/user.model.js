import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [4, 'Name must be at least 4 characters long'],
      maxlength: [50, 'Name must be at most 50 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required() {
        return this.authProvider === 'local' || this.authProvider === 'both';
      },
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'freelancer', 'both'],
      default: 'local',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      trim: true,
      default: '',
    },

    notificationPreferences: {
      emailEnabled: {
        type: Boolean,
        default: true,
      },
      inAppEnabled: {
        type: Boolean,
        default: true,
      },
      emailFrequency: {
        type: String,
        enum: ['instant', 'daily', 'weekly'],
        default: 'instant',
      },
      instantHighPriorityOnly: {
        type: Boolean,
        default: false,
      },
    },

    dashboardConfig: {
      companyName: {
        type: String,
        trim: true,
        default: '',
      },
      timezone: {
        type: String,
        trim: true,
        default: 'UTC',
      },
      telegramChatId: {
        type: String,
        trim: true,
        default: '',
      },
      feedName: {
        type: String,
        trim: true,
        default: 'Primary Feed',
      },
      feedActive: {
        type: Boolean,
        default: true,
      },
      allowNoBudget: {
        type: Boolean,
        default: true,
      },
      speciality: {
        type: String,
        trim: true,
        default: '',
      },
      freelancer: {
        type: String,
        trim: true,
        default: '',
      },
      clientMinSpend: {
        type: Number,
        min: 0,
        default: 0,
      },
      clientMinRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      excludedCountries: {
        type: [String],
        default: [],
      },
      includedCountries: {
        type: [String],
        default: [],
      },
      model: {
        type: String,
        default: 'GPT-4o Mini',
      },
      proposalPrompts: {
        type: [
          {
            title: {
              type: String,
              trim: true,
              default: '',
            },
            content: {
              type: String,
              default: '',
            },
          },
        ],
        default: [],
      },
    },

    // Job Matching Preferences
    jobPreferences: {
      keywords: {
        type: [String],
        default: [],
      },
      rateType: {
        type: String,
        enum: ['hourly', 'fixed'],
        default: 'hourly',
      },
      hourlyRate: {
        type: Number,
        min: 0,
      },
      fixedRate: {
        type: Number,
        min: 0,
      },
      hourlyRateRange: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 },
      },
      fixedRateRange: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 },
      },
      userRole: {
        type: String,
        enum: ['freelancer', 'agency'],
        default: 'freelancer',
      },
      selectedPlatform: {
        type: String,
        enum: ['upwork', 'freelancer'],
        default: 'upwork',
      },
      badJobCriteria: {
        type: [String],
        default: [],
      },
      upworkProfileUrl: {
        type: String,
        trim: true,
      },
      freelancerProfileUrl: {
        type: String,
        trim: true,
      },
      selectedLanguage: {
        type: String,
        trim: true,
        default: 'English',
      },
      autoTranslateDescription: {
        type: Boolean,
        default: false,
      },
    },

    freelancerAuth: {
      accessToken: {
        type: String,
        default: null,
      },
      refreshToken: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      scope: {
        type: String,
        default: null,
      },
      freelancerUserId: {
        type: String,
        default: null,
      },
      connectedAt: {
        type: Date,
        default: null,
      },
    },

    // Account status
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
      trim: true,
    },
    flaggedAt: {
      type: Date,
      default: null,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'blocked'],
      default: 'active',
    },
    statusReason: {
      type: String,
      default: '',
      trim: true,
    },
    statusUpdatedAt: {
      type: Date,
      default: null,
    },
    violationCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Terms and Conditions
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    termsVersion: {
      type: String,
      default: null,
    },
    termsAcceptedAt: {
      type: Date,
      default: null,
    },

    // Subscription
    subscription: {
      plan: {
        type: String,
        enum: ['none', 'manual', 'auto'],
        default: 'none',
      },
      frequency: {
        type: String,
        enum: ['monthly', 'annually'],
        default: 'monthly',
      },
      stripeCustomerId: { type: String, default: null },
      stripeSubscriptionId: { type: String, default: null },
      status: {
        type: String,
        enum: ['none', 'active', 'cancelled', 'past_due', 'trialing'],
        default: 'none',
      },
      subscribedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
    },

    // Coins
    coins: {
      type: Number,
      default: 0,
    },
    coinHistory: [
      {
        amount: { type: Number, required: true },
        type: { type: String, enum: ['credit', 'debit'], required: true },
        reason: { type: String, default: '' },
        jobId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Job',
          default: null,
        },
        proposalId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Proposal',
          default: null,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Statistics
    stats: {
      jobsViewed: { type: Number, default: 0 },
      jobsMatched: { type: Number, default: 0 },
      proposalsSent: { type: Number, default: 0 },
      proposalsAccepted: { type: Number, default: 0 },
      proposalsRejected: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
