const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  type: { type: String, enum: ["hourly", "fixed"], default: "hourly" },
});

const clientInfoSchema = new mongoose.Schema({
  country: { type: String, default: "" },
  city: { type: String, default: "" },
  totalSpent: { type: Number, default: 0 },
  totalHires: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  paymentVerified: { type: Boolean, default: false },
  location: { type: Object, default: {} },
  jobsPosted: { type: Number, default: 0 },
  hireRate: { type: Number, default: 0 },
  openJobs: { type: Number, default: 0 },
});

const jobSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    budget: { type: budgetSchema, default: {} },
    budgetType: { type: String, enum: ["hourly", "fixed"], default: "hourly" },
    skills: { type: [String], default: [] },
    category: { type: String, default: "" },
    subcategory: { type: String, default: "" },
    duration: { type: String, default: "" },
    workload: { type: String, default: "" },
    clientInfo: { type: clientInfoSchema, default: {} },
    proposals: { type: Number, default: 0 },
    postedDate: { type: Date, default: Date.now },
    url: { type: String, default: "" },
    score: { type: Number, default: 0 }, // AI quality score (0-100)
  },
  { timestamps: true }
);

// --- 🔧 Instance Methods ---

// ✅ Generate Upwork job URL
jobSchema.methods.generateJobUrl = function () {
  return `https://www.upwork.com/jobs/~${this.jobId}`;
};

// ✅ Check if job meets minimum criteria
jobSchema.methods.meetsMinimumCriteria = function (criteria) {
  const { minHourlyRate, minFixedRate, badJobCriteria } = criteria;

  // Hourly rate filter
  if (this.budgetType === "hourly" && minHourlyRate) {
    if (this.budget.max < parseFloat(minHourlyRate)) return false;
  }

  // Fixed rate filter
  if (this.budgetType === "fixed" && minFixedRate) {
    if (this.budget.amount < parseFloat(minFixedRate)) return false;
  }

  // Bad criteria filter
  if (badJobCriteria && badJobCriteria.length > 0) {
    for (const criterion of badJobCriteria) {
      if (this.matchesBadCriteria(criterion)) return false;
    }
  }

  return true;
};

// ✅ Match against bad job criteria
jobSchema.methods.matchesBadCriteria = function (criterion) {
  const lowerDesc = this.description.toLowerCase();
  const lowerTitle = this.title.toLowerCase();

  switch (criterion) {
    case "Looking for employee":
      return (
        lowerDesc.includes("looking for employee") ||
        lowerDesc.includes("full-time employee") ||
        lowerTitle.includes("employee")
      );

    case "Quick task":
      return (
        lowerDesc.includes("quick task") ||
        lowerDesc.includes("quick job") ||
        this.duration === "Less than 1 week"
      );

    case "Tutoring":
      return (
        lowerDesc.includes("tutor") ||
        lowerTitle.includes("tutor") ||
        lowerDesc.includes("teaching")
      );

    case "Urgent task":
      return (
        lowerDesc.includes("urgent") ||
        lowerDesc.includes("asap") ||
        lowerDesc.includes("immediately")
      );

    case "Non english job":
      return !this.isEnglish(this.description);

    case "Startups":
      return (
        lowerDesc.includes("startup") || this.clientInfo.totalSpent < 100
      );

    case "Not well described":
      return (
        this.description.length < 150 ||
        this.description.split(" ").length < 30
      );

    case "Rating less than 4.0":
      return this.clientInfo.rating < 4.0 && this.clientInfo.rating > 0;

    case "Total spent less than $1,000":
      return this.clientInfo.totalSpent < 1000;

    case "Low hire rate":
      return (
        this.clientInfo.hireRate < 50 && this.clientInfo.totalHires > 0
      );

    default:
      return false;
  }
};

// ✅ Simple English detection
jobSchema.methods.isEnglish = function (text) {
  const englishWords = text.match(/\b[a-zA-Z]+\b/g);
  return englishWords && englishWords.length > 10;
};

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
