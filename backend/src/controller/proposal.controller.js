import Proposal from '../models/proposal.model.js';
import Job from '../models/job.model.js';
import User from '../models/user.model.js';
import UsageRecord from '../models/usageRecord.model.js';
import mongoose from 'mongoose';
import aiService from '../services/ai.service.js';
import freelancerService from '../services/freelancer.service.js';
import freelancerWorkflowService from '../services/freelancerWorkflow.service.js';
import notificationService from '../services/notification.service.js';
import { toMonthKey } from '../utils/subscriptionPlans.js';

const normalizePlatform = platform => {
  const normalized = String(platform || '').toLowerCase();
  return normalized === 'freelancer' ? 'freelancer' : 'upwork';
};

const parseDurationToDays = value => {
  if (!value) return null;
  const text = String(value).toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  if (text.includes('week')) return Math.round(amount * 7);
  if (text.includes('month')) return Math.round(amount * 30);
  return Math.round(amount);
};

const computePeriodFromDeliveryDate = deliveryDate => {
  if (!deliveryDate) return null;
  const target = new Date(deliveryDate);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return null;
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const getFreelancerPeriodDays = (estimatedDuration, deliveryDate) =>
  computePeriodFromDeliveryDate(deliveryDate) ||
  parseDurationToDays(estimatedDuration);

const getDefaultProposalResponse = (job = null, user = null) =>
  aiService.getDefaultProposalResponse(job, user);

const buildJobLookupQuery = (jobIdentifier, userId) => {
  const normalizedIdentifier = String(jobIdentifier || '').trim();
  if (!normalizedIdentifier) return null;

  const orConditions = [
    { upworkJobId: normalizedIdentifier },
    { freelancerJobId: normalizedIdentifier },
    { sourceJobId: normalizedIdentifier },
  ];

  if (mongoose.Types.ObjectId.isValid(normalizedIdentifier)) {
    orConditions.unshift({ _id: normalizedIdentifier });
  }

  const lookup = { $or: orConditions };
  if (!userId) return lookup;

  return {
    $and: [
      lookup,
      {
        $or: [{ userId }, { userId: null }, { userId: { $exists: false } }],
      },
    ],
  };
};

/**
 * Generate proposal for a job
 * Asynchronous operation - returns placeholder immediately
 */
export const generateProposal = async (req, res, next) => {
  try {
    const { jobId: jobIdentifier } = req.params;
    const { aiService: preferredAIService = 'gemini' } = req.body;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    if (!userId) {
      const error = new Error('User not authenticated');
      error.statusCode = 401;
      throw error;
    }

    // Get job
    const lookupQuery = buildJobLookupQuery(jobIdentifier, userId);
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

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify user owns this job
    if (job.userId && job.userId.toString() !== userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }

    const jobObjectId = job._id;

    // Check if proposal already exists
    let proposal = await Proposal.findOne({ jobId: jobObjectId, userId });

    const isFreelancerJob = String(job?.source || '').includes('freelancer');

    if (!proposal) {
      // Create draft proposal
      const proposalPayload = {
        userId,
        jobId: jobObjectId,
        content: '',
        status: 'draft',
        aiService: preferredAIService,
      };

      // Set platform-specific job id on proposal for traceability
      if (String(job?.source || '').includes('freelancer')) {
        proposalPayload.freelancerJobId = job.freelancerJobId;
      } else {
        proposalPayload.upworkJobId = job.upworkJobId;
      }

      proposal = await Proposal.create(proposalPayload);
    } else {
      proposal.content = '';
      proposal.status = proposal.status === 'sent' ? proposal.status : 'draft';
      proposal.aiService = preferredAIService;
      proposal.aiModel = null;
      proposal.generatedAt = null;
      proposal.contentType = 'original';
      await proposal.save();
    }

    const usageMonth = req.usageMonth || toMonthKey();
    const selectedPlatform = normalizePlatform(
      req.currentPlatform ||
        req.body?.platform ||
        user.jobPreferences?.selectedPlatform ||
        (job?.source?.includes('freelancer') ? 'freelancer' : 'upwork')
    );

    const usageRecord = await UsageRecord.findOneAndUpdate(
      { userId, month: usageMonth },
      {
        $inc: { aiProposalsUsed: 1 },
        $addToSet: { platformsConnected: selectedPlatform },
        $setOnInsert: {
          orgId: null,
          autoSendUsed: 0,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    await notificationService.notifyUsageThresholdIfNeeded({
      userId,
      month: usageRecord?.month || usageMonth,
      featureName: 'monthly proposals',
    });

    // Generate proposal asynchronously (non-blocking)
    generateProposalAsync(proposal._id, job, user, preferredAIService).catch(
      error => console.error('Background proposal generation error:', error)
    );

    // Return immediately with message
    const workflow = isFreelancerJob
      ? freelancerWorkflowService.buildProposalWorkflowContext({
          job: job.toObject(),
          bidInput: req.body,
        })
      : null;
    const defaultResponse = getDefaultProposalResponse(
      job?.toObject?.() || job,
      user?.toObject?.() || user
    );

    res.status(200).json({
      success: true,
      message: 'Proposal generation started...',
      data: {
        proposalId: proposal._id,
        status: 'generating',
        jobId: jobObjectId,
        defaultResponse,
        workflow,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate proposal in background (non-blocking)
 */
async function generateProposalAsync(
  proposalId,
  job,
  user,
  preferredAIService
) {
  try {
    const resolvedProvider =
      aiService.resolveProposalProvider(preferredAIService);
    const resolvedModel = aiService.getProviderModel(resolvedProvider);
    const storedService =
      resolvedProvider === 'openai' || resolvedProvider === 'gemini'
        ? resolvedProvider
        : preferredAIService;
    const defaultResponse = getDefaultProposalResponse(
      job?.toObject?.() || job,
      user?.toObject?.() || user
    );
    const maxAttempts = 2;
    let generatedContent = '';
    let generationError = null;
    let attemptsUsed = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      attemptsUsed = attempt;
      try {
        generatedContent = await aiService.generateProposal({
          aiService: preferredAIService,
          job: job.toObject(),
          user: user.toObject(),
        });
        generationError = null;
        break;
      } catch (error) {
        generationError = error;
        if (attempt === maxAttempts) {
          break;
        }
      }
    }

    if (generationError) {
      throw generationError;
    }

    const normalizedGenerated = String(generatedContent || '').trim();
    const normalizedDefault = String(defaultResponse || '').trim();
    const usedFallbackTemplate =
      normalizedGenerated.length === 0 ||
      normalizedGenerated === normalizedDefault;

    // Update proposal with generated content
    await Proposal.findByIdAndUpdate(proposalId, {
      $set: {
        content: usedFallbackTemplate ? defaultResponse : generatedContent,
        aiModel: usedFallbackTemplate
          ? 'fallback-template'
          : resolvedModel || storedService,
        aiService: storedService,
        generatedAt: new Date(),
        contentType: 'original',
        generationAttempts: attemptsUsed,
        generationError: usedFallbackTemplate
          ? 'AI generation returned fallback/default content.'
          : null,
      },
    });
  } catch (error) {
    console.error('Proposal generation failed:', error);
    const defaultResponse = getDefaultProposalResponse(
      job?.toObject?.() || job,
      user?.toObject?.() || user
    );

    // Persist default content as a reliable fallback
    await Proposal.findByIdAndUpdate(proposalId, {
      $set: {
        content: defaultResponse,
        aiModel: 'fallback-template',
        aiService:
          aiService.resolveProposalProvider(preferredAIService) === 'fallback'
            ? null
            : preferredAIService,
        generatedAt: new Date(),
        contentType: 'original',
        generationAttempts: 2,
        generationError: String(
          error?.message || 'Unknown AI generation error'
        ),
      },
    });
  }
}

/**
 * Get proposal by ID
 */
export const getProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    const proposal = await Proposal.findById(proposalId)
      .populate('userId', 'name email')
      .populate('jobId');

    if (!proposal) {
      const error = new Error('Proposal not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify user owns this proposal
    if (proposal.userId._id.toString() !== userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }

    const defaultResponse = getDefaultProposalResponse(
      proposal?.jobId,
      proposal?.userId
    );

    res.status(200).json({
      success: true,
      data: {
        ...proposal.toObject(),
        defaultResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all proposals for user
 */
export const getUserProposals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, sortBy = '-createdAt' } = req.query;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    const skip = (page - 1) * limit;

    // Build filter
    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    const proposals = await Proposal.find(filter)
      .populate('jobId', 'title upworkJobId budgetType budget hourlyRate')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Proposal.countDocuments(filter);

    // Calculate stats
    const stats = {
      draft: await Proposal.countDocuments({ userId, status: 'draft' }),
      sent: await Proposal.countDocuments({ userId, status: 'sent' }),
      accepted: await Proposal.countDocuments({ userId, status: 'accepted' }),
      rejected: await Proposal.countDocuments({ userId, status: 'rejected' }),
      total,
    };

    res.status(200).json({
      success: true,
      data: {
        proposals,
        stats,
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
 * Send proposal to Upwork
 */
export const sendProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const { bidAmount, estimatedDuration, deliveryDate } = req.body;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      const error = new Error('Proposal not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (proposal.userId.toString() !== userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }

    if (!proposal.content) {
      const error = new Error(
        'Proposal content is empty. Generate proposal first.'
      );
      error.statusCode = 400;
      throw error;
    }

    const proposalJob = await Job.findById(proposal.jobId)
      .select(
        'source title budgetType budget hourlyRate upworkUrl freelancerUrl sourceJobId'
      )
      .lean();
    const isFreelancerJob = proposalJob?.source === 'freelancer_api';

    if (isFreelancerJob) {
      const normalizedBidAmount = Number(bidAmount || 0);
      if (!Number.isFinite(normalizedBidAmount) || normalizedBidAmount <= 0) {
        const error = new Error(
          'Bid amount is required for Freelancer project submission.'
        );
        error.statusCode = 400;
        throw error;
      }

      if (!estimatedDuration && !deliveryDate) {
        const error = new Error(
          'Estimated duration or delivery date is required for Freelancer bids.'
        );
        error.statusCode = 400;
        throw error;
      }
    }

    let freelancerBidId = null;
    let usedSystemFreelancerToken = false;

    if (isFreelancerJob) {
      const user = await User.findById(userId).select('freelancerAuth').lean();
      const freelancerToken = user?.freelancerAuth?.accessToken || null;
      usedSystemFreelancerToken = !freelancerToken;

      const periodDays = getFreelancerPeriodDays(
        estimatedDuration,
        deliveryDate
      );
      if (!periodDays) {
        const error = new Error(
          'Unable to determine bid duration. Provide a valid estimated duration or delivery date.'
        );
        error.statusCode = 400;
        throw error;
      }

      const projectId = proposalJob?.sourceJobId || null;
      if (!projectId) {
        const error = new Error(
          'Freelancer project ID is missing for this job.'
        );
        error.statusCode = 400;
        throw error;
      }

      const bidResponse = await freelancerService.submitBid({
        projectId,
        bidAmount: Number(bidAmount),
        periodDays,
        description: proposal.content,
        oauthToken: freelancerToken,
      });

      freelancerBidId =
        bidResponse?.result?.bid?.id ||
        bidResponse?.bid?.id ||
        bidResponse?.result?.id ||
        null;

      // Debug log for remote bid response
      try {
        console.debug('Freelancer bid response', {
          projectId,
          usedSystemToken: usedSystemFreelancerToken,
          freelancerTokenPresent: Boolean(freelancerToken),
          freelancerBidId,
          rawResponse: bidResponse,
        });
      } catch (logErr) {
        console.error('Failed to log freelancer bid response', logErr);
      }
    }

    // In production, send to Upwork API here
    // For now, mark as sent and update status

    // Update proposal
    proposal.status = 'sent';
    proposal.bidAmount = bidAmount || null;
    proposal.estimatedDuration = estimatedDuration || null;
    proposal.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    proposal.statusHistory.push({
      status: 'sent',
      timestamp: new Date(),
      notes: isFreelancerJob
        ? `Bid submitted using Freelancer workflow${
            freelancerBidId ? ` (bid ID: ${freelancerBidId})` : ''
          }${usedSystemFreelancerToken ? ' (system account)' : ''}`
        : 'Proposal sent to client',
    });

    await proposal.save();

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.proposalsSent': 1 },
    });

    const usageMonth = toMonthKey();
    const selectedPlatform = normalizePlatform(
      req.currentPlatform ||
        req.body?.platform ||
        (proposalJob?.source?.includes('freelancer') ? 'freelancer' : 'upwork')
    );

    await UsageRecord.findOneAndUpdate(
      { userId, month: usageMonth },
      {
        $inc: { autoSendUsed: 1 },
        $addToSet: { platformsConnected: selectedPlatform },
        $setOnInsert: {
          orgId: null,
          aiProposalsUsed: 0,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    await notificationService.notifyProposalSent({
      userId,
      proposal,
      job: proposalJob,
    });

    res.status(200).json({
      success: true,
      message: 'Proposal sent successfully',
      data: {
        proposal,
        workflow: isFreelancerJob
          ? freelancerWorkflowService.buildProposalWorkflowContext({
              job: proposalJob,
              bidInput: { bidAmount, estimatedDuration, deliveryDate },
            })
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update proposal status
 */
export const updateProposalStatus = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const { status, notes = '' } = req.body;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    const validStatuses = [
      'draft',
      'sent',
      'received',
      'viewed',
      'accepted',
      'rejected',
      'withdrawn',
    ];

    if (!validStatuses.includes(status)) {
      const error = new Error(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }

    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      const error = new Error('Proposal not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (proposal.userId.toString() !== userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }

    const oldStatus = proposal.status;
    proposal.status = status;

    // Add to status history
    proposal.statusHistory.push({
      status,
      timestamp: new Date(),
      notes,
    });

    // Update user stats based on status change
    const statUpdates = {};
    if (oldStatus !== 'accepted' && status === 'accepted') {
      statUpdates['stats.proposalsAccepted'] = 1;
    } else if (oldStatus !== 'rejected' && status === 'rejected') {
      statUpdates['stats.proposalsRejected'] = 1;
    }

    await proposal.save();

    if (status === 'sent') {
      const relatedJob = await Job.findById(proposal.jobId)
        .select('title source')
        .lean();

      await notificationService.notifyProposalSent({
        userId,
        proposal,
        job: relatedJob,
      });
    }

    if (status === 'rejected') {
      const relatedJob = await Job.findById(proposal.jobId)
        .select('title source')
        .lean();

      await notificationService.notifyProposalRejected({
        userId,
        proposal,
        job: relatedJob,
        reason: notes,
      });
    }

    if (Object.keys(statUpdates).length > 0) {
      await User.findByIdAndUpdate(userId, { $inc: statUpdates });
    }

    res.status(200).json({
      success: true,
      message: `Proposal status updated to ${status}`,
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upgrade proposal with case study
 */
export const upgradeProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const { caseStudy } = req.body;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    if (!caseStudy || caseStudy.trim() === '') {
      const error = new Error('Case study is required');
      error.statusCode = 400;
      throw error;
    }

    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      const error = new Error('Proposal not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (proposal.userId.toString() !== userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }

    if (!proposal.content) {
      const error = new Error('No proposal content to upgrade');
      error.statusCode = 400;
      throw error;
    }

    // Get job for context
    const job = await Job.findById(proposal.jobId);
    const user = await User.findById(userId);

    // Upgrade proposal asynchronously
    upgradeProposalAsync(proposalId, proposal, job, user, caseStudy).catch(
      error => console.error('Proposal upgrade error:', error)
    );

    res.status(200).json({
      success: true,
      message: 'Proposal upgrade started...',
      data: {
        proposalId,
        status: 'upgrading',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upgrade proposal in background
 */
async function upgradeProposalAsync(
  proposalId,
  proposal,
  job,
  user,
  caseStudyText
) {
  try {
    const upgradedContent = await aiService.upgradeProposalWithCaseStudy(
      proposal.content,
      job.toObject(),
      user.toObject(),
      caseStudyText,
      proposal.aiService
    );

    // Update proposal
    await Proposal.findByIdAndUpdate(proposalId, {
      $set: {
        content: upgradedContent,
        contentType: 'upgraded_with_case_study',
        caseStudy: {
          description: caseStudyText,
        },
        status: proposal.status, // Keep current status
      },
    });
  } catch (error) {
    console.error('Proposal upgrade failed:', error);
    await Proposal.findByIdAndUpdate(proposalId, {
      $set: {
        status: 'draft',
      },
    });
  }
}

/**
 * Copy proposal content
 */
export const copyProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      const error = new Error('Proposal not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (proposal.userId.toString() !== userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Proposal copied to clipboard',
      data: {
        content: proposal.content,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rate proposal quality
 */
export const rateProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const { rating, feedback } = req.body;
    const _userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    if (!rating || rating < 1 || rating > 5) {
      const error = new Error('Rating must be between 1 and 5');
      error.statusCode = 400;
      throw error;
    }

    const proposal = await Proposal.findByIdAndUpdate(
      proposalId,
      {
        $set: {
          userRating: rating,
          userFeedback: feedback || '',
        },
      },
      { new: true }
    );

    if (!proposal) {
      const error = new Error('Proposal not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Proposal rated successfully',
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete proposal
 */
export const deleteProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      const error = new Error('Proposal not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (proposal.userId.toString() !== userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 403;
      throw error;
    }

    await Proposal.findByIdAndDelete(proposalId);

    res.status(200).json({
      success: true,
      message: 'Proposal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get proposal stats for user
 */
export const getProposalStats = async (req, res, next) => {
  try {
    const userId =
      req.user?.id || req.user?._id || req.admin?.id || req.admin?._id;

    const stats = {
      total: await Proposal.countDocuments({ userId }),
      draft: await Proposal.countDocuments({ userId, status: 'draft' }),
      sent: await Proposal.countDocuments({ userId, status: 'sent' }),
      received: await Proposal.countDocuments({ userId, status: 'received' }),
      viewed: await Proposal.countDocuments({ userId, status: 'viewed' }),
      accepted: await Proposal.countDocuments({ userId, status: 'accepted' }),
      rejected: await Proposal.countDocuments({ userId, status: 'rejected' }),
      withdrawn: await Proposal.countDocuments({ userId, status: 'withdrawn' }),
    };

    const acceptanceRate =
      stats.sent > 0 ? ((stats.accepted / stats.sent) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        stats,
        acceptanceRate: `${acceptanceRate}%`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top performing proposal templates (by job category)
 * Aggregates proposals grouped by the category of the job they target,
 * and computes acceptance rate per category.
 */
export const getTopTemplates = async (req, res, next) => {
  try {
    const isAdmin = !!req.adminId;

    const matchStage = isAdmin
      ? {
          status: {
            $in: ['sent', 'accepted', 'rejected', 'viewed', 'received'],
          },
        }
      : {
          userId: req.user?._id || req.user?.id,
          status: {
            $in: ['sent', 'accepted', 'rejected', 'viewed', 'received'],
          },
        };

    const results = await Proposal.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$job.category', 'Uncategorised'] },
          total: { $sum: 1 },
          accepted: {
            $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          total: 1,
          accepted: 1,
          rate: {
            $concat: [
              {
                $toString: {
                  $round: [
                    { $multiply: [{ $divide: ['$accepted', '$total'] }, 100] },
                    0,
                  ],
                },
              },
              '%',
            ],
          },
        },
      },
      { $sort: { accepted: -1, total: -1 } },
      { $limit: 6 },
    ]);

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

/**
 * Get job category performance — count of proposals per job category.
 */
export const getJobCategoryPerformance = async (req, res, next) => {
  try {
    const isAdmin = !!req.adminId;

    const matchStage = isAdmin ? {} : { userId: req.user?._id || req.user?.id };

    const results = await Job.aggregate([
      { $match: { ...matchStage, isActive: true } },
      {
        $group: {
          _id: { $ifNull: ['$category', 'Uncategorised'] },
          totalJobs: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'proposals',
          let: { cat: '$_id' },
          pipeline: [
            {
              $lookup: {
                from: 'jobs',
                localField: 'jobId',
                foreignField: '_id',
                as: 'job',
              },
            },
            { $unwind: '$job' },
            {
              $match: {
                $expr: {
                  $eq: [
                    { $ifNull: ['$job.category', 'Uncategorised'] },
                    '$$cat',
                  ],
                },
              },
            },
          ],
          as: 'proposals',
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalJobs: 1,
          responses: { $size: '$proposals' },
        },
      },
      { $sort: { responses: -1, totalJobs: -1 } },
      { $limit: 6 },
    ]);

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};
