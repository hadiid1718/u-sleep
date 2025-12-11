const Job = require("../models/JobModel");
const UserPreferences = require("../models/UserPrefrencemodel");
const upworkService = require("../Services/UpworkServices");
const geminiService = require("../Services/GeminiServices");


// Helper: map Upwork/raw job object into internal Job shape
function mapUpworkToJob(raw = {}) {
  // Detailed logging for debugging
  console.log('Raw job data:', raw);

  const isHourly = (raw.job_type || '').toLowerCase() === 'hourly';
  const hourly = raw.hourly_budget || {};
  const client = raw.client || {};

  // Handle budget with detailed validation
  const budget = isHourly
    ? { 
        min: Number(hourly.min) || 0, 
        max: Number(hourly.max) || 0, 
        type: 'hourly',
        amount: 0 // Set 0 for hourly jobs
      }
    : { 
        amount: Number(raw.budget) || 0,
        type: 'fixed',
        min: 0, // Set 0 for fixed jobs
        max: 0  // Set 0 for fixed jobs
      };

  // Convert date with fallback
  const postedDate = raw.date_created
    ? new Date(raw.date_created)
    : new Date();

  const mapped = {
    jobId: raw.id || raw.jobId || '',
    title: raw.title || 'Untitled Job',
    description: raw.description || 'No description provided.',
    budget,
    budgetType: isHourly ? 'hourly' : 'fixed',
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    category: raw.category2 || raw.category || 'Uncategorized',
    subcategory: raw.subcategory2 || raw.subcategory || '',
    duration: raw.duration || 'Not specified',
    workload: raw.workload || 'Not specified',
    proposals: Number(raw.proposals) || 0,
    postedDate,
    clientInfo: {
      country: client.country || 'Unknown',
      city: client.city || 'Unknown',
      totalSpent: Number(client.total_spent) || 0,
      totalHires: Number(client.total_hires) || 0,
      totalReviews: Number(client.total_reviews) || 0,
      rating: Number(client.rating) || 0,
      paymentVerified: Boolean(client.payment_verified),
      hireRate: Number(client.hire_rate) || 0,
      jobsPosted: Number(client.jobs_posted) || 0,
      openJobs: Number(client.open_jobs) || 0
    },
    url: raw.url || raw.permalink || (raw.id ? `https://www.upwork.com/jobs/~${raw.id}` : '#')
  };

  // Log the mapped result for debugging
  console.log('Mapped job data:', mapped);

  return mapped;
}

// Search and filter jobs based on user preferences
const searchJobs = async (req, res) => {
  try {
    //  Destructure and assign defaults from request body
    const {
      keywords = [],
      hourlyRate = 0,
      fixedRate = 0,
      badJobCriteria = [],
      accountType = "freelancer",
      profileUrl = "",
    } = req.body;

    //  Create user preferences instance explicitly
    const userPreferences = new UserPreferences({
      keywords,
      hourlyRate,
      fixedRate,
      badJobCriteria,
      accountType,
      profileUrl,
    });

    //  Validate user preferences
    const validation = userPreferences.validatePreferences();
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    console.log("✅ Final userPreferences:", userPreferences);

    // Step 1: Fetch jobs from Upwork API
    const rawJobs = await upworkService.searchJobs(userPreferences);
    console.log(`📦 Fetched ${rawJobs.length} jobs from Upwork`);
    console.log('Raw jobs:', rawJobs);

    // Step 2: Map raw Upwork jobs into internal Job shape
    const mapped = Array.isArray(rawJobs) ? rawJobs.map(mapUpworkToJob) : [];
    console.log('Mapped jobs:', mapped);

    // Step 3: Convert to Job model and apply basic filters
    const jobInstances = mapped.map((jobData) => new Job(jobData));
    console.log('Job instances before filtering:', jobInstances.length);
    
    const jobs = jobInstances.filter((job) => {
      const criteria = {
        minHourlyRate: userPreferences.hourlyRate,
        minFixedRate: userPreferences.fixedRate,
        badJobCriteria: userPreferences.badJobCriteria,
      };
      console.log('Filtering job:', job.title);
      console.log('With criteria:', criteria);
      const meets = job.meetsMinimumCriteria(criteria);
      console.log('Meets criteria:', meets);
      return meets;
    });

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
    console.log(" Full Request Body:", req.body);
  console.log(" Headers:", req.headers);
  console.log(" Content-Type:", req.headers["content-type"]);

  try {
    const { jobData, userPreferences } = req.body;

    if (!jobData) {
      return res.status(400).json({
        success: false,
        error: "Job data is required",
      });
    }

    // Accept either a raw Upwork job shape or the internal shape
    const jobObj = jobData && jobData.id ? mapUpworkToJob(jobData) : jobData;
    const job = new Job(jobObj);
    const preferences = new UserPreferences(userPreferences || {});

    // Analyze with Gemini AI
    const analysis = await geminiService.analyzeSingleJob(job, preferences);

    res.status(200).json({
      success: true,
      job: {
        ...(typeof job.toObject === 'function' ? job.toObject() : job),
        ...analysis,
      },
    });
  } catch (error) {
    console.error(" Error in analyzeJob:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single job by ID
const getJobById = async (req, res) => {
  console.log(req.params)
  try {
    const { id } = req.params;

    const jobData = await upworkService.getJobById(id);

    if (!jobData) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    // Map raw Upwork job to internal shape if needed
    const jobObj = jobData && jobData.id ? mapUpworkToJob(jobData) : jobData;
    const job = new Job(jobObj);

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Error in getJobById:", error);
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
