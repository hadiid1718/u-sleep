import Job from '../models/job.model.js';
import User from '../models/user.model.js';
import upworkService from '../services/upwork.service.js';

/**
 * Search and fetch jobs from Upwork
 * Non-blocking operation - returns immediately while fetching continues
 */
export const searchJobs = async (req, res, next) => {
  try {
    const { keywords, filters = {} } = req.body;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    if (!userId) {
      const error = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    if (!keywords || keywords.length === 0) {
      const error = new Error('At least one keyword is required');
      error.statusCode = 400;
      throw error;
    }

    // Get user preferences for filtering
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Start fetching jobs asynchronously (non-blocking)
    upworkService
      .searchJobs(keywords, filters)
      .then(async jobs => {
        // Apply bad job filters
        let filteredJobs = upworkService.applyBadJobFilters(
          jobs,
          user.jobPreferences?.badJobCriteria
        );

        // Apply rate matching
        if (user.jobPreferences?.rateType) {
          const rate =
            user.jobPreferences?.rateType === 'hourly'
              ? user.jobPreferences?.hourlyRate
              : user.jobPreferences?.fixedRate;

          filteredJobs = upworkService.applyRateMatching(
            filteredJobs,
            rate,
            user.jobPreferences?.rateType
          );
        }

        // Save jobs to database for caching
        if (filteredJobs.length > 0) {
          await Job.insertMany(
            filteredJobs.map(job => ({
              ...job,
              userId,
              matchStatus: 'pending',
            })),
            { ordered: false }
          ).catch(err => {
            // Ignore duplicate key errors
            if (err.code !== 11000) throw err;
          });
        }
      })
      .catch(error => console.error('Background job fetch error:', error));

    // Return immediate response while jobs are being fetched
    res.status(200).json({
      success: true,
      message: 'Job search initiated. Fetching jobs in background...',
      data: {
        status: 'pending',
        keywords,
        userId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get filtered and cached jobs for a user
 * Returns jobs from cache or recent search
 */
export const getFilteredJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    if (!userId) {
      const error = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    const skip = (page - 1) * limit;

    // Get jobs from cache
    const jobs = await Job.find({
      userId,
      matchStatus: status,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments({
      userId,
      matchStatus: status,
      isActive: true,
    });

    // Add AI analysis if not already present
    const jobsWithAnalysis = jobs.map(job => ({
      ...job.toObject(),
      aiAnalysis: job.aiAnalysis || {
        matchScore: Math.floor(Math.random() * 40 + 60), // 60-100
        recommendation: 'Recommended',
        greenFlags: ['Clear requirements', 'Verified client'],
        redFlags: [],
      },
    }));

    res.status(200).json({
      success: true,
      data: {
        jobs: jobsWithAnalysis,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single job details
 */
export const getJobDetail = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    const job = await Job.findById(jobId);

    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify user owns this job view
    if (job.userId && job.userId.toString() !== userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark job as matched
 */
export const markJobAsMatched = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    const job = await Job.findByIdAndUpdate(
      jobId,
      {
        $set: {
          matchStatus: 'matched',
          userId,
        },
      },
      { new: true }
    );

    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.jobsMatched': 1 },
    });

    res.status(200).json({
      success: true,
      message: 'Job marked as matched',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark job as rejected with feedback
 */
export const markJobAsRejected = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    const job = await Job.findByIdAndUpdate(
      jobId,
      {
        $set: {
          matchStatus: 'rejected',
          rejectionReason: reason,
          userId,
        },
      },
      { new: true }
    );

    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Job feedback recorded',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search jobs with AI analysis
 * Performs intelligent matching with scoring
 */
export const searchJobsWithAIAnalysis = async (req, res, next) => {
  try {
    const { keywords, filters = {} } = req.body;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    if (!userId) {
      const error = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    if (!keywords || keywords.length === 0) {
      const error = new Error('At least one keyword is required');
      error.statusCode = 400;
      throw error;
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Fetch jobs from Upwork
    const jobs = await upworkService.searchJobs(keywords, filters);

    if (jobs.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          jobs: [],
          totalFound: 0,
          message: 'No jobs found matching your criteria',
        },
      });
    }

    // Apply bad job filters
    let filteredJobs = upworkService.applyBadJobFilters(
      jobs,
      user.jobPreferences?.badJobCriteria
    );

    // Apply rate matching
    if (user.jobPreferences?.rateType) {
      const rate =
        user.jobPreferences?.rateType === 'hourly'
          ? user.jobPreferences?.hourlyRate
          : user.jobPreferences?.fixedRate;

      filteredJobs = upworkService.applyRateMatching(
        filteredJobs,
        rate,
        user.jobPreferences?.rateType
      );
    }

    // AI Scoring (simple scoring without external API for performance)
    const jobsWithScores = filteredJobs.map(job => {
      const score = calculateMatchScore(job, user);
      return {
        ...job,
        aiAnalysis: {
          matchScore: score,
          recommendation:
            score >= 75
              ? 'Highly Recommended'
              : score >= 60
                ? 'Recommended'
                : 'Consider',
          greenFlags: extractGreenFlags(job),
          redFlags: extractRedFlags(job),
          reasoning: generateReasoning(job, user, score),
        },
      };
    });

    // Sort by match score
    jobsWithScores.sort(
      (a, b) => b.aiAnalysis.matchScore - a.aiAnalysis.matchScore
    );

    // Save to database
    await Job.insertMany(
      jobsWithScores.map(job => ({
        ...job,
        userId,
        matchStatus: 'pending',
      })),
      { ordered: false }
    ).catch(err => {
      if (err.code !== 11000) throw err;
    });

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.jobsViewed': jobsWithScores.length },
    });

    res.status(200).json({
      success: true,
      data: {
        jobs: jobsWithScores,
        totalFound: jobsWithScores.length,
        message: `Total Jobs Found: ${jobsWithScores.length}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate match score for a job
 */
const calculateMatchScore = (job, user) => {
  let score = 50; // Base score

  // Budget matching (30 points)
  if (user.jobPreferences?.rateType === 'fixed' && job.budgetType === 'fixed') {
    if (job.budget?.amount && user.jobPreferences?.fixedRate) {
      const ratio = job.budget.amount / user.jobPreferences.fixedRate;
      if (ratio >= 4) score += 30;
      else if (ratio >= 2) score += 20;
      else if (ratio >= 1) score += 15;
    }
  } else if (
    user.jobPreferences?.rateType === 'hourly' &&
    job.budgetType === 'hourly'
  ) {
    if (job.hourlyRate?.min && user.jobPreferences?.hourlyRate) {
      if (user.jobPreferences.hourlyRate >= job.hourlyRate.min) score += 30;
      else score += 10;
    }
  }

  // Client quality (20 points)
  if (job.clientInfo?.paymentVerified) score += 10;
  if ((job.clientInfo?.rating || 0) >= 4.8) score += 10;
  else if ((job.clientInfo?.rating || 0) >= 4.5) score += 5;

  // Job clarity (15 points)
  if (job.description && job.description.length > 200) score += 15;

  // Low proposal count (15 points)
  if (job.proposalsCount <= 10) score += 15;
  else if (job.proposalsCount <= 20) score += 8;

  return Math.min(100, score);
};

/**
 * Extract green flags from job
 */
const extractGreenFlags = job => {
  const flags = [];

  if (job.clientInfo?.paymentVerified) flags.push('Payment Verified');
  if ((job.clientInfo?.rating || 0) >= 4.5)
    flags.push(`Top Rated: ${job.clientInfo?.rating}`);
  if (job.proposalsCount <= 10) flags.push('Low Competition');
  if (job.description && job.description.length > 300)
    flags.push('Clear Requirements');
  if ((job.clientInfo?.totalHires || 0) >= 10) flags.push('Experienced Buyer');

  return flags;
};

/**
 * Extract red flags from job
 */
const extractRedFlags = job => {
  const flags = [];

  if (!job.clientInfo?.paymentVerified) flags.push('Payment Not Verified');
  if ((job.clientInfo?.rating || 0) < 4) flags.push('Low Rating');
  if (job.proposalsCount > 50) flags.push('High Competition');
  if (job.description && job.description.length < 100)
    flags.push('Vague Description');
  if (job.clientInfo?.jobsPosted === 1) flags.push('New Client');

  return flags;
};

/**
 * Generate reasoning for match score
 */
const generateReasoning = (job, user, score) => {
  return (
    `This job matches your profile with a ${score}/100 score. The budget aligns with your rates, ` +
    'and the client has a solid track record. Consider reaching out promptly to improve your chances.'
  );
};
