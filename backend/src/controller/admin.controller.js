import User from '../models/user.model.js';
import AdminSetting from '../models/adminSetting.model.js';
import AdminCase from '../models/adminCase.model.js';
import Notification from '../models/notification.model.js';
import { sendMail } from '../config/nodemailer.js';
import { getMetricsSnapshot, getMetricsSummary } from '../services/metrics.service.js';

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
        user.statusReason = String(statusReason || user.statusReason || '').trim();
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
