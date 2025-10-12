const Job = require("../models/JobModel");
const UserPreferences = require("../models/UserPrefrencemodel");
const upworkService = require("../Services/UpworkServices");
const geminiService = require("../Services/GeminiServices");

// Search and filter jobs based on user preferences
const searchJobs = async (req, res) => {
  try {
    const userPreferences = new UserPreferences(req.body);

    // Validate user preferences
    const validation = userPreferences.validate();
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    console.log("🔍 Searching jobs with preferences:", userPreferences);

    // Step 1: Fetch jobs from Upwork API
    const rawJobs = await upworkService.searchJobs(userPreferences);
    console.log(`📦 Fetched ${rawJobs.length} jobs from Upwork`);

    // Step 2: Convert to Job model and apply basic filters
    const jobs = rawJobs
      .map((jobData) => new Job(jobData))
      .filter((job) =>
        job.meetsMinimumCriteria({
          minHourlyRate: userPreferences.hourlyRate,
          minFixedRate: userPreferences.fixedRate,
          badJobCriteria: userPreferences.badJobCriteria,
        })
      );

    console.log(`✅ ${jobs.length} jobs passed basic filtering`);

    // Step 3: Use AI (Gemini) to analyze and score jobs
    const analyzedJobs = await geminiService.analyzeJobs(jobs, userPreferences);

    // Step 4: Sort by AI score (highest first)
    analyzedJobs.sort((a, b) => b.score - a.score);

    // Step 5: Return top results
    const topJobs = analyzedJobs.slice(0, 20);

    res.status(200).json({
      success: true,
      count: topJobs.length,
      totalFound: rawJobs.length,
      afterFiltering: jobs.length,
      jobs: topJobs,
    });
  } catch (error) {
    console.error("❌ Error in searchJobs:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Analyze a single job using AI
const analyzeJob = async (req, res) => {
  try {
    const { jobData, userPreferences } = req.body;

    if (!jobData) {
      return res.status(400).json({
        success: false,
        error: "Job data is required",
      });
    }

    const job = new Job(jobData);
    const preferences = new UserPreferences(userPreferences);

    // Analyze with Gemini AI
    const analysis = await geminiService.analyzeSingleJob(job, preferences);

    res.status(200).json({
      success: true,
      job: {
        ...job,
        ...analysis,
      },
    });
  } catch (error) {
    console.error("❌ Error in analyzeJob:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single job by ID
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const jobData = await upworkService.getJobById(id);

    if (!jobData) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    const job = new Job(jobData);

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("❌ Error in getJobById:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  searchJobs,
  getJobById,
  analyzeJob,
};
