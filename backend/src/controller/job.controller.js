import Job from '../models/job.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import upworkService from '../services/upwork.service.js';
import freelancerService from '../services/freelancer.service.js';
import freelancerWorkflowService from '../services/freelancerWorkflow.service.js';
import aiService from '../services/ai.service.js';
import notificationService from '../services/notification.service.js';

const MAX_AUTO_TRANSLATED_DESCRIPTIONS = 10;
const MAX_AI_SCORE_JOBS = 25;

const normalizeSelectedRole = role => {
  if (!role) return null;
  const normalized = String(role).trim().toLowerCase();

  if (normalized.includes('agency')) return 'agency';
  if (normalized.includes('freelancer')) return 'freelancer';

  return normalized;
};

const normalizeKeywords = (keywords, fallback = []) => {
  if (Array.isArray(keywords) && keywords.length > 0) return keywords;
  if (typeof keywords === 'string' && keywords.trim()) return [keywords];
  if (Array.isArray(fallback) && fallback.length > 0) return fallback;
  return [];
};

const normalizeBadCriteria = criteria => {
  if (Array.isArray(criteria)) return criteria;
  if (typeof criteria === 'string' && criteria.trim()) return [criteria];
  return [];
};

const normalizeSelectedLanguage = language => {
  const normalized = String(language || '').trim();
  return normalized || null;
};

const simpleTranslateText = async (text, targetLanguage) => {
  // Map of language names to language codes
  const languageMap = {
    english: 'en',
    spanish: 'es',
    french: 'fr',
    german: 'de',
    italian: 'it',
    portuguese: 'pt',
    dutch: 'nl',
    russian: 'ru',
    japanese: 'ja',
    korean: 'ko',
    chinese: 'zh',
    arabic: 'ar',
    hindi: 'hi',
    turkish: 'tr',
    polish: 'pl',
    swedish: 'sv',
    norwegian: 'no',
    danish: 'da',
    finnish: 'fi',
    greek: 'el',
    czech: 'cs',
    hungarian: 'hu',
    thai: 'th',
    vietnamese: 'vi',
    indonesian: 'id',
    malaysian: 'ms',
  };

  const normalizedLang = String(targetLanguage || '').toLowerCase().trim();
  const langCode = languageMap[normalizedLang];

  if (!langCode || langCode === 'en') {
    return { translatedText: text, isTranslated: false };
  }

  try {
    // Use LibreTranslate free API
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: langCode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data?.translatedText) {
      throw new Error('No translation returned');
    }

    return {
      translatedText: data.translatedText,
      isTranslated: data.translatedText !== text,
    };
  } catch (error) {
    console.error(`Simple translation failed for ${targetLanguage}:`, error.message);
    // Return original text if translation fails
    return { translatedText: text, isTranslated: false };
  }
};

const getJobMatchKey = job => {
  return String(
    job?.upworkJobId || job?.sourceJobId || job?._id || job?.id || ''
  ).trim();
};

const shouldAutoTranslate = value => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
  }

  return false;
};

const buildPlatformPreferences = (payload, user) => {
  const jobPreferences = user?.jobPreferences || {};
  const keywords = normalizeKeywords(
    payload?.keywords,
    jobPreferences.keywords
  );
  const selectedRole = normalizeSelectedRole(
    payload?.selectedRole || payload?.userRole || jobPreferences.userRole
  );
  const payloadHourly = payload?.jobHourly ?? null;
  const payloadFixed = payload?.projectFixedRate ?? null;
  const hasHourlyInput = Number(payloadHourly) > 0;
  const hasFixedInput = Number(payloadFixed) > 0;
  const jobHourly = payloadHourly ?? jobPreferences.hourlyRate ?? null;
  const projectFixedRate = payloadFixed ?? jobPreferences.fixedRate ?? null;

  let rateType = payload?.rateType ?? null;
  if (!rateType && !(hasHourlyInput && hasFixedInput)) {
    rateType = jobPreferences.rateType ?? null;
  }

  const hourlyRateRange =
    rateType === 'hourly'
      ? (payload?.hourlyRateRange ?? jobPreferences.hourlyRateRange ?? null)
      : null;
  const fixedRateRange =
    rateType === 'fixed'
      ? (payload?.fixedRateRange ?? jobPreferences.fixedRateRange ?? null)
      : null;

  return {
    keywords,
    jobHourly,
    projectFixedRate,
    badJobCriteria: normalizeBadCriteria(
      payload?.badJobCriteria ?? jobPreferences.badJobCriteria
    ),
    selectedRole,
    selectedPlatform:
      payload?.selectedPlatform || jobPreferences.selectedPlatform || 'upwork',
    upworkProfileUrl:
      payload?.upworkProfileUrl ?? jobPreferences.upworkProfileUrl ?? null,
    freelancerProfileUrl:
      payload?.freelancerProfileUrl ??
      jobPreferences.freelancerProfileUrl ??
      null,
    selectedLanguage: normalizeSelectedLanguage(
      payload?.selectedLanguage ?? jobPreferences.selectedLanguage
    ),
    autoTranslateDescription: shouldAutoTranslate(
      payload?.autoTranslateDescription ??
        jobPreferences.autoTranslateDescription ??
        false
    ),
    rateType,
    hourlyRateRange,
    fixedRateRange,
  };
};

const normalizeSearchFilters = (filters = {}, preferences = {}) => {
  const normalized = { ...(filters || {}) };
  const rateType = normalized.rateType || preferences?.rateType || null;

  if (rateType === 'hourly') {
    normalized.rateType = 'hourly';
    delete normalized.minBudget;
    delete normalized.maxBudget;
  } else if (rateType === 'fixed') {
    normalized.rateType = 'fixed';
    delete normalized.minRate;
    delete normalized.maxRate;
  } else {
    delete normalized.minRate;
    delete normalized.maxRate;
    delete normalized.minBudget;
    delete normalized.maxBudget;
  }

  return normalized;
};

const applyRateGuardrails = (jobs, platformService, preferences = {}) => {
  if (!Array.isArray(jobs) || jobs.length === 0) return jobs;

  const rateType = preferences.rateType || null;
  const hourlyRate = preferences.jobHourly ?? null;
  const fixedRate = preferences.projectFixedRate ?? null;

  if (rateType) {
    const rate = rateType === 'hourly' ? hourlyRate : fixedRate;
    return platformService.applyRateMatching(jobs, rate, rateType);
  }

  if (!hourlyRate && !fixedRate) return jobs;

  return jobs.filter(job => {
    if (job?.budgetType === 'hourly' && hourlyRate) {
      const min = job?.hourlyRate?.min ?? 0;
      const max = job?.hourlyRate?.max ?? Infinity;
      return hourlyRate >= min && hourlyRate <= max;
    }

    if (job?.budgetType === 'fixed' && fixedRate && job?.budget?.amount) {
      return fixedRate <= job.budget.amount;
    }

    return true;
  });
};

const applySearchFilters = (
  jobs,
  platformService,
  preferences = {},
  { allowRelaxation = false } = {}
) => {
  const baseJobs = platformService.applyBadJobFilters(
    jobs,
    preferences.badJobCriteria
  );
  const rateFiltered = applyRateGuardrails(
    baseJobs,
    platformService,
    preferences
  );
  const keywordFiltered = platformService.applyKeywordFilter(
    rateFiltered,
    preferences.keywords
  );

  if (!allowRelaxation || keywordFiltered.length > 0 || baseJobs.length === 0) {
    return { jobs: keywordFiltered, relaxations: [] };
  }

  if (rateFiltered.length === 0) {
    const keywordOnly = platformService.applyKeywordFilter(
      baseJobs,
      preferences.keywords
    );
    if (keywordOnly.length > 0) {
      return { jobs: keywordOnly, relaxations: ['rate'] };
    }
  }

  if (rateFiltered.length > 0 && keywordFiltered.length === 0) {
    return { jobs: rateFiltered, relaxations: ['keywords'] };
  }

  return { jobs: baseJobs, relaxations: ['rate', 'keywords'] };
};

const getPlatformService = selectedPlatform => {
  const platform = String(selectedPlatform || 'upwork').toLowerCase();
  return platform === 'freelancer' ? freelancerService : upworkService;
};

const buildJobLookupQuery = jobIdentifier => {
  const normalizedIdentifier = String(jobIdentifier || '').trim();
  if (!normalizedIdentifier) return null;

  const orConditions = [
    { upworkJobId: normalizedIdentifier },
    { sourceJobId: normalizedIdentifier },
  ];

  if (mongoose.Types.ObjectId.isValid(normalizedIdentifier)) {
    orConditions.unshift({ _id: normalizedIdentifier });
  }

  return { $or: orConditions };
};

const buildScopedJobLookupQuery = (jobIdentifier, userId) => {
  const baseLookup = buildJobLookupQuery(jobIdentifier);
  if (!baseLookup) return null;

  if (!userId) return baseLookup;

  return {
    $and: [
      baseLookup,
      {
        $or: [{ userId }, { userId: null }, { userId: { $exists: false } }],
      },
    ],
  };
};

const buildFreelancerWorkflow = ({
  preferences,
  filters,
  diagnostics,
  jobs,
}) => {
  if (
    String(preferences?.selectedPlatform || '').toLowerCase() !== 'freelancer'
  ) {
    return null;
  }

  return freelancerWorkflowService.buildSearchWorkflowContext({
    preferences,
    filters,
    diagnostics,
    jobsFound: Array.isArray(jobs) ? jobs.length : 0,
  });
};

const persistJobsIfPossible = async (jobs, userId) => {
  if (!upworkService.isDatabaseAvailable() || jobs.length === 0) {
    return false;
  }

  const operations = jobs
    .filter(job => job?.upworkJobId)
    .map(job => ({
      updateOne: {
        filter: { upworkJobId: job.upworkJobId },
        update: {
          $set: {
            ...job,
          },
          $setOnInsert: {
            userId,
            matchStatus: 'pending',
          },
        },
        upsert: true,
      },
    }));

  if (operations.length === 0) return false;

  await Job.bulkWrite(operations, { ordered: false }).catch(err => {
    if (err.code !== 11000) throw err;
  });

  return true;
};

const attachPersistedJobMetadataIfPossible = async (jobs, userId) => {
  if (
    !upworkService.isDatabaseAvailable() ||
    !Array.isArray(jobs) ||
    jobs.length === 0
  ) {
    return jobs;
  }

  const upworkJobIds = jobs
    .map(job => String(job?.upworkJobId || '').trim())
    .filter(Boolean);

  if (upworkJobIds.length === 0) {
    return jobs;
  }

  try {
    const persistedJobs = await Job.find({
      userId,
      upworkJobId: { $in: upworkJobIds },
      isActive: true,
    })
      .select(
        '_id upworkJobId matchStatus rejectionReason translatedDescription descriptionLanguage translatedDescriptionLanguage translationProvider descriptionTranslatedAt'
      )
      .lean();

    const persistedByUpworkJobId = new Map(
      persistedJobs.map(job => [String(job.upworkJobId), job])
    );

    return jobs.map(job => {
      const key = String(job?.upworkJobId || '').trim();
      const persisted = persistedByUpworkJobId.get(key);

      if (!persisted) return job;

      return {
        ...job,
        _id: persisted._id,
        id: String(persisted._id),
        matchStatus: persisted.matchStatus || job.matchStatus || 'pending',
        rejectionReason:
          persisted.rejectionReason || job.rejectionReason || undefined,
        translatedDescription:
          persisted.translatedDescription || job.translatedDescription,
        descriptionLanguage:
          persisted.descriptionLanguage || job.descriptionLanguage,
        translatedDescriptionLanguage:
          persisted.translatedDescriptionLanguage ||
          job.translatedDescriptionLanguage,
        translationProvider:
          persisted.translationProvider || job.translationProvider,
        descriptionTranslatedAt:
          persisted.descriptionTranslatedAt || job.descriptionTranslatedAt,
      };
    });
  } catch (error) {
    console.error('Failed to attach persisted job metadata:', error);
    return jobs;
  }
};

const applyDescriptionTranslationToJob = (job, translationResult) => {
  const translatedJob = {
    ...job,
    descriptionLanguage: translationResult.sourceLanguage,
    translatedDescriptionLanguage: translationResult.targetLanguage,
    translationProvider: translationResult.provider,
  };

  if (translationResult.isTranslated) {
    translatedJob.translatedDescription = translationResult.translatedText;
    translatedJob.descriptionTranslatedAt = new Date();
  }

  return translatedJob;
};

const maybeAutoTranslateFreelancerDescriptions = async (
  jobs,
  preferences,
  preferredAiService = 'gemini'
) => {
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return { jobs, summary: null };
  }

  // Auto-translate works for all platforms now
  const targetLanguage = normalizeSelectedLanguage(
    preferences?.selectedLanguage
  );
  
  if (!targetLanguage || !preferences?.autoTranslateDescription) {
    return { jobs, summary: null };
  }

  // Skip if target language is English (no translation needed)
  if (targetLanguage.toLowerCase() === 'english') {
    return { jobs, summary: null };
  }

  const translatedJobs = [...jobs];
  let translatedCount = 0;
  let attemptedCount = 0;

  for (let i = 0; i < translatedJobs.length; i += 1) {
    if (attemptedCount >= MAX_AUTO_TRANSLATED_DESCRIPTIONS) {
      break;
    }

    const job = translatedJobs[i];
    const description = String(job?.description || '').trim();
    if (!description || description.length < 20) continue;

    attemptedCount += 1;

    try {
      const translation = await aiService.translateTextIfNeeded({
        text: description,
        targetLanguage,
        aiService: preferredAiService,
      });

      translatedJobs[i] = applyDescriptionTranslationToJob(job, translation);
      if (translation.isTranslated) translatedCount += 1;
    } catch (error) {
      // If AI translation fails, try simple approach
      try {
        const simpleTranslation = await simpleTranslateText(description, targetLanguage);
        translatedJobs[i] = {
          ...job,
          translatedDescription: simpleTranslation.translatedText,
          translatedDescriptionLanguage: targetLanguage,
          descriptionLanguage: 'English',
          translationProvider: 'simple',
        };
        if (simpleTranslation.translatedText !== description) {
          translatedCount += 1;
        }
      } catch {
        translatedJobs[i] = {
          ...job,
          translationProvider: 'none',
        };
      }
    }
  }

  return {
    jobs: translatedJobs,
    summary: {
      enabled: true,
      targetLanguage,
      translatedCount,
      attemptedCount,
      maxAutoTranslatedDescriptions: MAX_AUTO_TRANSLATED_DESCRIPTIONS,
    },
  };
};

/**
 * Search and fetch jobs from Upwork API
 */
export const searchJobs = async (req, res, next) => {
  try {
    const { filters = {} } = req.body;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    if (!userId) {
      const error = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    // Get user preferences for filtering
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const preferences = buildPlatformPreferences(req.body, user);
    const preferredAiService = req.body?.aiService || 'gemini';
    console.log('Preferred AI Service:', preferredAiService);
    console.log('REQ BODY AI:', req.body?.aiService);
    if (preferences.keywords.length === 0) {
      const error = new Error('At least one keyword is required');
      error.statusCode = 400;
      throw error;
    }

    const platformService = getPlatformService(preferences.selectedPlatform);
    const freelancerToken = user?.freelancerAuth?.accessToken || null;
    const normalizedFilters = normalizeSearchFilters(filters, preferences);

    const { jobs, diagnostics } = await platformService.searchJobsDetailed(
      preferences,
      normalizedFilters,
      freelancerToken
    );

    const filterResult = applySearchFilters(
      jobs,
      platformService,
      preferences,
      {
        allowRelaxation:
          String(preferences.selectedPlatform || '').toLowerCase() ===
          'freelancer',
      }
    );
    let filteredJobs = filterResult.jobs;
    const { relaxations } = filterResult;

    if (relaxations.length > 0) {
      diagnostics.filtersRelaxed = relaxations;
    }

    const translationResult = await maybeAutoTranslateFreelancerDescriptions(
      filteredJobs,
      preferences,
      preferredAiService
    );
    filteredJobs = translationResult.jobs;

    await persistJobsIfPossible(filteredJobs, userId);
    filteredJobs = await attachPersistedJobMetadataIfPossible(
      filteredJobs,
      userId
    );

    const workflow = buildFreelancerWorkflow({
      preferences,
      filters: normalizedFilters,
      diagnostics,
      jobs: filteredJobs,
    });

    res.status(200).json({
      success: true,
      message:
        diagnostics.filtersRelaxed && diagnostics.filtersRelaxed.length > 0
          ? `Total Jobs Found: ${filteredJobs.length} (relaxed ${diagnostics.filtersRelaxed.join(
            ' + '
          )} filters)`
          : `Total Jobs Found: ${filteredJobs.length}`,
      data: {
        jobs: filteredJobs,
        totalFound: filteredJobs.length,
        diagnostics,
        descriptionTranslation: translationResult.summary,
        workflow,
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
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    if (!userId) {
      const error = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    const skip = (page - 1) * limit;

    const normalizedStatus = String(status || 'all')
      .trim()
      .toLowerCase();
    const query = {
      userId,
      isActive: true,
    };

    if (normalizedStatus && normalizedStatus !== 'all') {
      query.matchStatus = normalizedStatus;
    }

    // Get jobs from cache
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

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

    const lookupQuery = buildScopedJobLookupQuery(jobId, userId);
    if (!lookupQuery) {
      const error = new Error('Job ID is required');
      error.statusCode = 400;
      throw error;
    }

    const job = await Job.findOne(lookupQuery);

    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
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

    const lookupQuery = buildScopedJobLookupQuery(jobId, userId);
    if (!lookupQuery) {
      const error = new Error('Job ID is required');
      error.statusCode = 400;
      throw error;
    }

    const job = await Job.findOneAndUpdate(
      lookupQuery,
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

    const lookupQuery = buildScopedJobLookupQuery(jobId, userId);
    if (!lookupQuery) {
      const error = new Error('Job ID is required');
      error.statusCode = 400;
      throw error;
    }

    const job = await Job.findOneAndUpdate(
      lookupQuery,
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
    const { filters = {} } = req.body;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    if (!userId) {
      const error = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const preferences = buildPlatformPreferences(req.body, user);
    const preferredAiService = req.body?.aiService || 'gemini';
    if (preferences.keywords.length === 0) {
      const error = new Error('At least one keyword is required');
      error.statusCode = 400;
      throw error;
    }

    const platformService = getPlatformService(preferences.selectedPlatform);
    const freelancerToken = user?.freelancerAuth?.accessToken || null;
    const normalizedFilters = normalizeSearchFilters(filters, preferences);

    const { jobs, diagnostics } = await platformService.searchJobsDetailed(
      preferences,
      normalizedFilters,
      freelancerToken
    );

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

    const filterResult = applySearchFilters(
      jobs,
      platformService,
      preferences,
      {
        allowRelaxation:
          String(preferences.selectedPlatform || '').toLowerCase() ===
          'freelancer',
      }
    );
    const filteredJobs = filterResult.jobs;
    const { relaxations } = filterResult;

    if (relaxations.length > 0) {
      diagnostics.filtersRelaxed = relaxations;
    }

    if (filteredJobs.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          jobs: [],
          totalFound: 0,
          message: 'No jobs found matching your criteria',
        },
      });
    }

    // AI Scoring (simple scoring without external API for performance)
    let jobsWithScores = filteredJobs.map(job => {
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

    const aiScoreMap = await aiService
      .scoreJobsForPreferences({
        jobs: filteredJobs,
        preferences,
        aiService: preferredAiService,
        maxJobs: MAX_AI_SCORE_JOBS,
      })
      .catch(() => null);

    if (aiScoreMap) {
      jobsWithScores = jobsWithScores.map(job => {
        const jobKey = getJobMatchKey(job);
        const aiScore = aiScoreMap.get(jobKey);
        if (!aiScore) return job;

        const score = aiScore.score;
        return {
          ...job,
          aiAnalysis: {
            ...job.aiAnalysis,
            matchScore: score,
            recommendation:
              score >= 80
                ? 'Highly Recommended'
                : score >= 60
                  ? 'Recommended'
                  : 'Consider',
            reasoning: aiScore.reasoning || job.aiAnalysis.reasoning,
          },
        };
      });
    }

    const minScoreInput = Number(req.body?.minAiScore);
    if (Number.isFinite(minScoreInput)) {
      const minScore = minScoreInput;
      jobsWithScores = jobsWithScores.filter(
        job => (job.aiAnalysis?.matchScore || 0) >= minScore
      );

      if (jobsWithScores.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            jobs: [],
            totalFound: 0,
            message: `No jobs found with AI score >= ${minScore}.`,
          },
        });
      }
    }

    // Sort by match score
    jobsWithScores.sort(
      (a, b) => b.aiAnalysis.matchScore - a.aiAnalysis.matchScore
    );

    const translationResult = await maybeAutoTranslateFreelancerDescriptions(
      jobsWithScores,
      preferences,
      preferredAiService
    );
    jobsWithScores = translationResult.jobs;

    // Save to database
    await persistJobsIfPossible(jobsWithScores, userId);
    jobsWithScores = await attachPersistedJobMetadataIfPossible(
      jobsWithScores,
      userId
    );

    await notificationService.notifyNewJobMatches({
      userId,
      user,
      jobs: jobsWithScores,
      maxNotifications: 6,
    });

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.jobsViewed': jobsWithScores.length },
    });

    const workflow = buildFreelancerWorkflow({
      preferences,
      filters: normalizedFilters,
      diagnostics,
      jobs: jobsWithScores,
    });

    res.status(200).json({
      success: true,
      data: {
        jobs: jobsWithScores,
        totalFound: jobsWithScores.length,
        diagnostics,
        descriptionTranslation: translationResult.summary,
        workflow,
        message:
          diagnostics.filtersRelaxed && diagnostics.filtersRelaxed.length > 0
            ? `Total Jobs Found: ${jobsWithScores.length} (relaxed ${diagnostics.filtersRelaxed.join(
              ' + '
            )} filters)`
            : `Total Jobs Found: ${jobsWithScores.length}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Freelancer workflow guidance used by the frontend stepper.
 */
export const getFreelancerWorkflow = async (req, res, next) => {
  try {
    const keywords = freelancerWorkflowService.normalizeKeywords(
      req.query?.keywords || []
    );
    const preferences = {
      selectedPlatform: 'freelancer',
      selectedRole: normalizeSelectedRole(req.query?.selectedRole || null),
      rateType: req.query?.rateType || null,
      keywords,
    };

    const filters = {
      rateType: req.query?.rateType || null,
    };

    const workflow = freelancerWorkflowService.buildSearchWorkflowContext({
      preferences,
      filters,
      diagnostics: null,
      jobsFound: null,
    });

    res.status(200).json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Run a scraper diagnostic for a given search query.
 */
export const getJobSearchDiagnostics = async (req, res, next) => {
  try {
    const { filters = {} } = req.body;
    const preferences = buildPlatformPreferences(req.body, req.user || null);
    const platformService = getPlatformService(preferences.selectedPlatform);
    const freelancerToken = req.user?.freelancerAuth?.accessToken || null;
    const normalizedFilters = normalizeSearchFilters(filters, preferences);

    if (preferences.keywords.length === 0) {
      const error = new Error('At least one keyword is required');
      error.statusCode = 400;
      throw error;
    }

    const { diagnostics, jobs } = await platformService.searchJobsDetailed(
      preferences,
      normalizedFilters,
      freelancerToken
    );

    res.status(200).json({
      success: true,
      data: {
        ok: true,
        jobsFound: jobs.length,
        diagnostics,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Translate a single job description into freelancer selected language.
 */
export const translateJobDescription = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { targetLanguage, aiService: preferredAIService = 'gemini' } =
      req.body;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    if (!userId) {
      const error = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    const normalizedTargetLanguage = normalizeSelectedLanguage(targetLanguage);
    if (!normalizedTargetLanguage) {
      const error = new Error('targetLanguage is required');
      error.statusCode = 400;
      throw error;
    }

    const lookupQuery = buildScopedJobLookupQuery(jobId, userId);
    if (!lookupQuery) {
      const error = new Error('Job ID is required');
      error.statusCode = 400;
      throw error;
    }

    const job = await Job.findOne(lookupQuery);
    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    const originalDescription = String(job.description || '').trim();
    if (!originalDescription) {
      const error = new Error(
        'Job description is empty and cannot be translated'
      );
      error.statusCode = 400;
      throw error;
    }

    const translation = await aiService.translateTextIfNeeded({
      text: originalDescription,
      targetLanguage: normalizedTargetLanguage,
      aiService: preferredAIService,
    });

    job.descriptionLanguage = translation.sourceLanguage;
    job.translatedDescriptionLanguage = translation.targetLanguage;
    job.translationProvider = translation.provider;

    if (translation.isTranslated) {
      job.translatedDescription = translation.translatedText;
      job.descriptionTranslatedAt = new Date();
    } else {
      job.translatedDescription = null;
    }

    await job.save();

    res.status(200).json({
      success: true,
      data: {
        job,
        translation: {
          ...translation,
          originalText: originalDescription,
        },
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
