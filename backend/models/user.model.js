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