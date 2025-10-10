const mongoose = require("mongoose");

const demoSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    name: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [
        /^\d{4}-\d{2}-\d{2}$/,
        "Date must be in YYYY-MM-DD format",
      ],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
    },
    fullDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create compound index to ensure unique date-time slots
demoSchema.index({ date: 1, time: 1 }, { unique: true });

// Add index for querying by status and date
demoSchema.index({ status: 1, fullDate: 1 });

// Add index for email lookups
demoSchema.index({ email: 1 });

// Virtual for formatted date
demoSchema.virtual("formattedDate").get(function () {
  return this.fullDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Method to check if demo is upcoming
demoSchema.methods.isUpcoming = function () {
  return this.fullDate > new Date() && this.status === "scheduled";
};

// Static method to get upcoming demos
demoSchema.statics.getUpcoming = function () {
  return this.find({
    fullDate: { $gte: new Date() },
    status: "scheduled",
  }).sort({ fullDate: 1, time: 1 });
};

// Pre-save hook to validate date is not in the past
demoSchema.pre("save", function (next) {
  if (this.isNew) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (this.fullDate < today) {
      next(new Error("Cannot schedule demo for a past date"));
    }
  }
  next();
});

const Demo = mongoose.model("Demo", demoSchema);

module.exports = Demo;