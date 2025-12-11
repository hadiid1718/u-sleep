const mongoose = require("mongoose");

const userPreferencesSchema = new mongoose.Schema(
  {
    // Array of job-related keywords
    keywords: {
      type: [String],
      required: [true, "At least one keyword is required"],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Keywords array cannot be empty",
      },
    },

    // Hourly rate (for hourly jobs)
    hourlyRate: {
      type: Number,
      min: [0, "Hourly rate cannot be negative"],
      default: 0,
    },

    // Fixed rate (for fixed-price jobs)
    fixedRate: {
      type: Number,
      min: [0, "Fixed rate cannot be negative"],
      default: 0,
    },

    // Array of job types or tags the user wants to avoid
    badJobCriteria: {
      type: [String],
      default: [],
    },

    // Account type: freelancer or agency
    accountType: {
      type: String,
      enum: ["freelancer", "agency"],
      default: "freelancer",
    },

    // User’s Upwork profile link
    profileUrl: {
      type: String,
      required: false,
      default: ""
      // validate: {
      //   validator: (url) =>
      //     /^https:\/\/www\.upwork\.com\/freelancers\/~[a-zA-Z0-9]+$/.test(url),
      //   message: "Please provide a valid Upwork profile URL (e.g. https://www.upwork.com/freelancers/~0123456789abcdef)",
      // },
    },

    // Optional reference to a User model (if you have user auth)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

//
// ✅ --- METHODS SECTION ---
//

// Validate preferences before using them
userPreferencesSchema.methods.validatePreferences = function () {
  const errors = [];

  if (!this.keywords || this.keywords.length === 0) {
    errors.push("At least one keyword is required");
  }

  if (!this.hourlyRate && !this.fixedRate) {
    errors.push("Either hourly or fixed rate must be specified");
  }

  if (this.hourlyRate < 0 || this.fixedRate < 0) {
    errors.push("Rates cannot be negative");
  }

  // NOTE: profileUrl is optional for searching; do not require it here.

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Convert preferences into Upwork API query parameters
userPreferencesSchema.methods.toSearchQuery = function () {
  return {
    q: this.keywords.join(" OR "),
    sort: "recency",
    page_size: 50,
    page_offset: 0,
  };
};

const UserPreferences = mongoose.model("UserPreferences", userPreferencesSchema);

module.exports = UserPreferences;
