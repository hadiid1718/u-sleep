import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [ true, "Name is required"],
        trim: true,
        minlength: [4, "Name must be at least 4 characters long"],
        maxlength: [50, "Name must be at most 50 characters long"]
    },
    email: {
        type: String,
        required: [ true, "Email is required"],
        trim: true,
        unique: true,
        lowercase: true,
    },
    password: { 
        type:String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
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
        badJobCriteria: {
            type: [String],
            default: [],
        },
        upworkProfileUrl: {
            type: String,
            trim: true,
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
    coinHistory: [{
        amount: { type: Number, required: true },
        type: { type: String, enum: ['credit', 'debit'], required: true },
        reason: { type: String, default: '' },
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
        proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', default: null },
        createdAt: { type: Date, default: Date.now },
    }],

    // Statistics
    stats: {
        jobsViewed: { type: Number, default: 0 },
        jobsMatched: { type: Number, default: 0 },
        proposalsSent: { type: Number, default: 0 },
        proposalsAccepted: { type: Number, default: 0 },
        proposalsRejected: { type: Number, default: 0 },
    },

}, {timestamps:true})

const User = mongoose.model("User", userSchema);

export default User;