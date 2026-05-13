import User from '../models/user.model.js';
import AdminSetting from '../models/adminSetting.model.js';
import AdminCase from '../models/adminCase.model.js';
import Notification from '../models/notification.model.js';
import Subscription from '../models/subscription.model.js';
import BillingPlan from '../models/billingPlan.model.js';
import ReviewVideo from '../models/reviewVideo.model.js';
import { sendMail } from '../config/nodemailer.js';
import aiService from '../services/ai.service.js';
import {
  getMetricsSnapshot,
  getMetricsSummary,
} from '../services/metrics.service.js';
import { getPlanConfig, PLAN_CONFIG } from '../utils/subscriptionPlans.js';

const sanitizeUser = user => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  accountStatus: user.accountStatus,
  statusReason: user.statusReason || null,
  statusUpdatedAt: user.statusUpdatedAt || null,
  violationCount: user.violationCount || 0,
  isFlagged: Boolean(user.isFlagged),
  flagReason: user.flagReason || null,
  stats: user.stats || {},
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getOrCreateSettings = async adminEmail => {
  const settings = await AdminSetting.findOne().lean();
  if (settings) return settings;

  const created = await AdminSetting.create({
    updatedBy: adminEmail || null,
    updatedAt: new Date(),
  });

  return created.toObject();
};

const applyViolationPolicy = async (user, settings) => {
  if (!user || !settings?.autoSuspendEnabled) return user;

  if (
    typeof user.violationCount === 'number' &&
    user.violationCount >= Number(settings.violationLimit || 0) &&
    user.accountStatus === 'active'
  ) {
    user.accountStatus = 'suspended';
    user.statusReason = 'Auto-suspended by violation policy';
    user.statusUpdatedAt = new Date();
  }

  return user;
};

const sendCaseEmail = async ({ userEmail, subject, body }) => {
  if (!userEmail) return;
  await sendMail({
    to: userEmail,
    subject,
    text: body,
    html: `<div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;"><h2>${subject}</h2><p>${body}</p></div>`,
  });
};

const createCaseNotification = async ({ userId, subject, body }) => {
  if (!userId) return null;

  return Notification.create({
    userId,
    type: 'admin_case_update',
    group: 'account',
    title: subject,
    body,
    platform: 'Admin',
    priority: 'medium',
    icon: 'shield',
    statusBadge: 'Case Update',
    cta: [],
    read: false,
    timestamp: new Date(),
  });
};

const normalizeSearch = value => String(value || '').trim();

const mapSubscriptionRecord = subscription => {
  const planConfig = getPlanConfig(subscription.plan) || null;
  const user = subscription.userId || {};

  return {
    _id: subscription._id,
    userId: user._id || subscription.userId || null,
    userName: user.name || 'Unknown user',
    userEmail: user.email || '',
    accountStatus: user.accountStatus || null,
    stripeCustomerId: subscription.stripeCustomerId || null,
    stripeSubscriptionId: subscription.stripeSubscriptionId || null,
    plan: subscription.plan,
    planLabel: planConfig?.name || subscription.plan,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd || null,
    cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd),
    autoSendEnabled: Boolean(subscription.autoSendEnabled),
    platformLimit: subscription.platformLimit || planConfig?.platformLimit || 0,
    proposalLimit: subscription.proposalLimit || planConfig?.proposalLimit || 0,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
};

const mapReviewVideoRecord = video => ({
  _id: video._id,
  title: video.title,
  videoUrl: video.videoUrl,
  thumbnailUrl: video.thumbnailUrl || '',
  description: video.description || '',
  reviewerName: video.reviewerName,
  reviewerRole: video.reviewerRole || '',
  uploadedByLabel: video.uploadedByLabel || video.uploadedBy?.name || 'Admin',
  uploadedBy: video.uploadedBy || null,
  isActive: Boolean(video.isActive),
  createdAt: video.createdAt,
  updatedAt: video.updatedAt,
});

const resolvePlanPayload = planId => {
  const planConfig = getPlanConfig(planId) || PLAN_CONFIG[planId];
  if (!planConfig) return null;

  return {
    autoSendEnabled: planConfig.autoSendEnabled,
    platformLimit: planConfig.platformLimit,
    proposalLimit: planConfig.proposalLimit,
  };
};

export const getAdminSession = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        admin: req.admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminMetrics = async (req, res, next) => {
  try {
    const summary = getMetricsSummary();
    const snapshot = getMetricsSnapshot();
    const defaultModules = [
      'auth',
      'users',
      'jobs',
      'proposals',
      'billing',
      'notifications',
      'comparisons',
      'review-video',
      'products',
      'demo',
      'admin',
      'webhooks',
    ];

    const moduleMap = new Map(snapshot.map(item => [item.name, item]));
    const modules = defaultModules.map(name => {
      return (
        moduleMap.get(name) || {
          name,
          requests: 0,
          errors: 0,
          errorRate: 0,
          avgResponseMs: 0,
          lastStatusCode: null,
          lastDurationMs: null,
          lastRequestAt: null,
          health: 'idle',
        }
      );
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          ...summary,
          modulesTracked: modules.length,
        },
        modules,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;

    const query = {};
    if (status) {
      query.accountStatus = String(status).toLowerCase();
    }

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const parsedLimit = Math.min(50, Math.max(1, Number(limit)));
    const parsedPage = Math.max(1, Number(page));
    const skip = (parsedPage - 1) * parsedLimit;

    const [items, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .select('-password')
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items: items.map(sanitizeUser),
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const {
      name,
      email,
      accountStatus,
      violationCount,
      statusReason,
      isFlagged,
      flagReason,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (typeof name === 'string') user.name = name.trim();
    if (typeof email === 'string') user.email = email.trim().toLowerCase();
    if (typeof violationCount === 'number') {
      user.violationCount = Math.max(0, violationCount);
    }

    if (typeof isFlagged === 'boolean') user.isFlagged = isFlagged;
    if (typeof flagReason === 'string') user.flagReason = flagReason.trim();

    if (accountStatus) {
      const normalizedStatus = String(accountStatus).toLowerCase();
      if (['active', 'suspended', 'blocked'].includes(normalizedStatus)) {
        user.accountStatus = normalizedStatus;
        user.statusReason = String(
          statusReason || user.statusReason || ''
        ).trim();
        user.statusUpdatedAt = new Date();
      }
    }

    const settings = await getOrCreateSettings(req.admin?.email);
    await applyViolationPolicy(user, settings);

    await user.save();

    res.status(200).json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const normalizedStatus = String(status || '').toLowerCase();
    if (!['active', 'suspended', 'blocked'].includes(normalizedStatus)) {
      const error = new Error('Invalid status');
      error.statusCode = 400;
      throw error;
    }

    user.accountStatus = normalizedStatus;
    user.statusReason = String(reason || '').trim();
    user.statusUpdatedAt = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check configured AI providers and basic reachability
 */
export const checkAIProviders = async (req, res, next) => {
  try {
    const results = [];

    // OpenAI check
    const hasOpenAI = Boolean(aiService.openaiApiKey);
    if (!hasOpenAI) {
      results.push({
        provider: 'openai',
        configured: false,
        reachable: false,
        detail: 'OPENAI_API_KEY not set',
      });
    } else {
      try {
        const model = aiService.openaiModel || 'gpt-4-turbo';
        const resp = await fetch(`https://api.openai.com/v1/models/${model}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${aiService.openaiApiKey}` },
        });

        if (resp.ok) {
          results.push({
            provider: 'openai',
            configured: true,
            reachable: true,
            detail: `Model ${model} reachable`,
          });
        } else {
          const txt = await resp.text().catch(() => '');
          results.push({
            provider: 'openai',
            configured: true,
            reachable: false,
            detail: `HTTP ${resp.status}: ${txt.substring(0, 200)}`,
          });
        }
      } catch (err) {
        results.push({
          provider: 'openai',
          configured: true,
          reachable: false,
          detail: String(err.message),
        });
      }
    }

    // Gemini check
    const hasGemini = Boolean(aiService.geminiApiKey);
    if (!hasGemini) {
      results.push({
        provider: 'gemini',
        configured: false,
        reachable: false,
        detail: 'GOOGLE_GEMINI_API_KEY not set',
      });
    } else {
      try {
        const model = aiService.geminiModel || 'gemini-2.5-flash';
        // Attempt to resolve the Gemini model via the client
        await aiService.getGeminiModel();
        results.push({
          provider: 'gemini',
          configured: true,
          reachable: true,
          detail: `Model ${model} reachable`,
        });
      } catch (err) {
        results.push({
          provider: 'gemini',
          configured: true,
          reachable: false,
          detail: String(err.message),
        });
      }
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const listCases = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const query = {};
    if (status) query.status = String(status).toLowerCase();

    const parsedLimit = Math.min(50, Math.max(1, Number(limit)));
    const parsedPage = Math.max(1, Number(page));
    const skip = (parsedPage - 1) * parsedLimit;

    const [items, total] = await Promise.all([
      AdminCase.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('userId', 'name email accountStatus violationCount')
        .lean(),
      AdminCase.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCase = async (req, res, next) => {
  try {
    const { userId, subject, description } = req.body;

    if (!userId || !subject || !description) {
      const error = new Error('userId, subject, and description are required');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const created = await AdminCase.create({
      userId: user._id,
      userEmail: user.email,
      subject,
      description,
    });

    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

export const resolveCase = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { status, resolution, action, adminNotes } = req.body;

    const adminCase = await AdminCase.findById(caseId);
    if (!adminCase) {
      const error = new Error('Case not found');
      error.statusCode = 404;
      throw error;
    }

    const normalizedStatus = String(status || '').toLowerCase();
    if (!['resolved', 'rejected'].includes(normalizedStatus)) {
      const error = new Error('Invalid status');
      error.statusCode = 400;
      throw error;
    }

    const normalizedAction = String(action || 'none').toLowerCase();
    if (!['none', 'suspend', 'unsuspend', 'block'].includes(normalizedAction)) {
      const error = new Error('Invalid action');
      error.statusCode = 400;
      throw error;
    }

    adminCase.status = normalizedStatus;
    adminCase.action = normalizedAction;
    adminCase.resolution = String(resolution || '').trim();
    adminCase.adminNotes = String(adminNotes || '').trim();
    adminCase.resolvedAt = new Date();
    adminCase.resolvedBy = req.admin?.email || null;

    await adminCase.save();

    const user = await User.findById(adminCase.userId);
    if (user && normalizedAction !== 'none') {
      if (normalizedAction === 'unsuspend') {
        user.accountStatus = 'active';
        user.statusReason = '';
      } else if (normalizedAction === 'suspend') {
        user.accountStatus = 'suspended';
        user.statusReason = 'Suspended after case review';
      } else if (normalizedAction === 'block') {
        user.accountStatus = 'blocked';
        user.statusReason = 'Blocked after case review';
      }
      user.statusUpdatedAt = new Date();
      await user.save();
    }

    const emailSubject = `Case Update: ${adminCase.subject}`;
    const emailBody =
      adminCase.resolution ||
      'Your case has been reviewed by the admin team. Please contact support if you need more details.';

    try {
      await sendCaseEmail({
        userEmail: adminCase.userEmail,
        subject: emailSubject,
        body: emailBody,
      });
    } catch (error) {
      console.error('Failed to send case email:', error);
    }

    try {
      await createCaseNotification({
        userId: adminCase.userId,
        subject: emailSubject,
        body: emailBody,
      });
    } catch (error) {
      console.error('Failed to create case notification:', error);
    }

    res.status(200).json({
      success: true,
      data: adminCase,
    });
  } catch (error) {
    next(error);
  }
};

export const getViolationSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings(req.admin?.email);
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateViolationSettings = async (req, res, next) => {
  try {
    const { violationLimit, autoSuspendEnabled } = req.body;

    const settingsDoc = await AdminSetting.findOne();
    const settings = settingsDoc || new AdminSetting();

    if (typeof violationLimit === 'number') {
      settings.violationLimit = Math.max(1, violationLimit);
    }

    if (typeof autoSuspendEnabled === 'boolean') {
      settings.autoSuspendEnabled = autoSuspendEnabled;
    }

    settings.updatedBy = req.admin?.email || null;
    settings.updatedAt = new Date();

    await settings.save();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const listSubscriptions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      plan = '',
    } = req.query;

    const parsedPage = Math.max(1, Number(page));
    const parsedLimit = Math.min(50, Math.max(1, Number(limit)));
    const skip = (parsedPage - 1) * parsedLimit;
    const query = {};

    if (status) {
      query.status = String(status).toLowerCase();
    }

    if (plan) {
      query.plan = String(plan).toLowerCase();
    }

    const trimmedSearch = normalizeSearch(search);
    if (trimmedSearch) {
      const regex = new RegExp(trimmedSearch, 'i');
      const matchingUsers = await User.find({
        $or: [{ name: regex }, { email: regex }],
      })
        .select('_id')
        .lean();

      const userIds = matchingUsers.map(user => user._id);
      if (userIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            items: [],
            availablePlans: Object.keys(PLAN_CONFIG).map(planId => ({
              planId,
              name: getPlanConfig(planId)?.name || planId,
            })),
            pagination: {
              total: 0,
              page: parsedPage,
              limit: parsedLimit,
              pages: 0,
            },
          },
        });
      }

      query.userId = { $in: userIds };
    }

    const [items, total, billingPlans] = await Promise.all([
      Subscription.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('userId', 'name email accountStatus')
        .lean(),
      Subscription.countDocuments(query),
      BillingPlan.find({ isActive: true }).sort({ monthlyPrice: 1 }).lean(),
    ]);

    let availablePlans = [];
    if (billingPlans.length > 0) {
      availablePlans = billingPlans.map(planItem => ({
        planId: planItem.planId,
        name: planItem.name,
        monthlyPrice: planItem.monthlyPrice,
        proposalLimit: planItem.proposalLimit,
        platformLimit: planItem.platformLimit,
        autoSendEnabled: planItem.autoSendEnabled,
        stripePriceId: planItem.stripePriceId,
      }));
    } else {
      availablePlans = Object.keys(PLAN_CONFIG).map(planId => ({
        planId,
        name: getPlanConfig(planId)?.name || planId,
        monthlyPrice: getPlanConfig(planId)?.monthlyPrice || 0,
        proposalLimit: getPlanConfig(planId)?.proposalLimit || 0,
        platformLimit: getPlanConfig(planId)?.platformLimit || 0,
        autoSendEnabled: getPlanConfig(planId)?.autoSendEnabled || false,
        stripePriceId: null,
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        items: items.map(mapSubscriptionRecord),
        availablePlans,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      const error = new Error('Subscription not found');
      error.statusCode = 404;
      throw error;
    }

    const {
      plan,
      status,
      cancelAtPeriodEnd,
      autoSendEnabled,
      platformLimit,
      proposalLimit,
      currentPeriodEnd,
      stripeCustomerId,
      stripeSubscriptionId,
    } = req.body;

    if (typeof plan === 'string' && PLAN_CONFIG[plan]) {
      subscription.plan = plan;
      const fallbackPlan = resolvePlanPayload(plan);

      if (typeof autoSendEnabled !== 'boolean') {
        subscription.autoSendEnabled =
          fallbackPlan?.autoSendEnabled ?? subscription.autoSendEnabled;
      }
      if (typeof platformLimit !== 'number') {
        subscription.platformLimit =
          fallbackPlan?.platformLimit ?? subscription.platformLimit;
      }
      if (typeof proposalLimit !== 'number') {
        subscription.proposalLimit =
          fallbackPlan?.proposalLimit ?? subscription.proposalLimit;
      }
    }

    if (typeof status === 'string' && status.trim()) {
      subscription.status = status.trim().toLowerCase();
    }

    if (typeof cancelAtPeriodEnd === 'boolean') {
      subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;
    }

    if (typeof autoSendEnabled === 'boolean') {
      subscription.autoSendEnabled = autoSendEnabled;
    }

    if (typeof platformLimit === 'number') {
      subscription.platformLimit = Math.max(1, platformLimit);
    }

    if (typeof proposalLimit === 'number') {
      subscription.proposalLimit = Math.max(0, proposalLimit);
    }

    if (currentPeriodEnd !== undefined) {
      subscription.currentPeriodEnd = currentPeriodEnd
        ? new Date(currentPeriodEnd)
        : null;
    }

    if (typeof stripeCustomerId === 'string') {
      subscription.stripeCustomerId = stripeCustomerId.trim() || null;
    }

    if (typeof stripeSubscriptionId === 'string') {
      subscription.stripeSubscriptionId = stripeSubscriptionId.trim() || null;
    }

    await subscription.save();

    const populated = await Subscription.findById(subscription._id)
      .populate('userId', 'name email accountStatus')
      .lean();

    res.status(200).json({
      success: true,
      data: mapSubscriptionRecord(populated),
    });
  } catch (error) {
    next(error);
  }
};

export const listReviewVideos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(1, Number(page));
    const parsedLimit = Math.min(50, Math.max(1, Number(limit)));
    const skip = (parsedPage - 1) * parsedLimit;

    const [items, total] = await Promise.all([
      ReviewVideo.find()
        .sort({ isActive: -1, createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('uploadedBy', 'name email')
        .lean(),
      ReviewVideo.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items: items.map(mapReviewVideoRecord),
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createReviewVideo = async (req, res, next) => {
  try {
    const {
      title,
      videoUrl,
      thumbnailUrl,
      description,
      reviewerName,
      reviewerRole,
      isActive,
    } = req.body;

    if (!title || !videoUrl || !reviewerName) {
      const error = new Error(
        'Title, video URL, and reviewer name are required'
      );
      error.statusCode = 400;
      throw error;
    }

    if (isActive) {
      await ReviewVideo.updateMany({}, { isActive: false });
    }

    const reviewVideo = await ReviewVideo.create({
      title,
      videoUrl,
      thumbnailUrl: thumbnailUrl || '',
      description: description || '',
      reviewerName,
      reviewerRole: reviewerRole || '',
      isActive: isActive !== false,
      uploadedByLabel: req.admin?.email || 'Admin',
    });

    const populated = await ReviewVideo.findById(reviewVideo._id)
      .populate('uploadedBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: mapReviewVideoRecord(populated),
    });
  } catch (error) {
    next(error);
  }
};

export const updateReviewVideo = async (req, res, next) => {
  try {
    const { reviewVideoId } = req.params;
    const video = await ReviewVideo.findById(reviewVideoId);

    if (!video) {
      const error = new Error('Review video not found');
      error.statusCode = 404;
      throw error;
    }

    const {
      title,
      videoUrl,
      thumbnailUrl,
      description,
      reviewerName,
      reviewerRole,
      isActive,
    } = req.body;

    if (typeof title === 'string' && title.trim()) video.title = title.trim();
    if (typeof videoUrl === 'string' && videoUrl.trim())
      video.videoUrl = videoUrl.trim();
    if (thumbnailUrl !== undefined)
      video.thumbnailUrl = String(thumbnailUrl || '');
    if (description !== undefined)
      video.description = String(description || '');
    if (typeof reviewerName === 'string' && reviewerName.trim())
      video.reviewerName = reviewerName.trim();
    if (reviewerRole !== undefined)
      video.reviewerRole = String(reviewerRole || '');

    if (typeof isActive === 'boolean') {
      if (isActive) {
        await ReviewVideo.updateMany(
          { _id: { $ne: video._id } },
          { isActive: false }
        );
      }
      video.isActive = isActive;
    }

    await video.save();

    const populated = await ReviewVideo.findById(video._id)
      .populate('uploadedBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      data: mapReviewVideoRecord(populated),
    });
  } catch (error) {
    next(error);
  }
};

export const setActiveReviewVideo = async (req, res, next) => {
  try {
    const { reviewVideoId } = req.params;
    const video = await ReviewVideo.findById(reviewVideoId);

    if (!video) {
      const error = new Error('Review video not found');
      error.statusCode = 404;
      throw error;
    }

    await ReviewVideo.updateMany(
      { _id: { $ne: video._id } },
      { isActive: false }
    );
    video.isActive = true;
    await video.save();

    const populated = await ReviewVideo.findById(video._id)
      .populate('uploadedBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      data: mapReviewVideoRecord(populated),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReviewVideo = async (req, res, next) => {
  try {
    const { reviewVideoId } = req.params;
    const video = await ReviewVideo.findById(reviewVideoId);

    if (!video) {
      const error = new Error('Review video not found');
      error.statusCode = 404;
      throw error;
    }

    const wasActive = Boolean(video.isActive);
    await ReviewVideo.findByIdAndDelete(reviewVideoId);

    if (wasActive) {
      const nextVideo = await ReviewVideo.findOne().sort({ createdAt: -1 });
      if (nextVideo) {
        nextVideo.isActive = true;
        await nextVideo.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Review video deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
