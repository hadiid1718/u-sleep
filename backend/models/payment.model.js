import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    stripeSessionId: {
        type: String,
        required: true,
        unique: true,
    },
    stripePaymentIntentId: {
        type: String,
        default: null,
    },
    plan: {
        type: String,
        enum: ['manual', 'auto'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'usd',
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'pending',
    },
    coinsAwarded: {
        type: Number,
        default: 0,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
