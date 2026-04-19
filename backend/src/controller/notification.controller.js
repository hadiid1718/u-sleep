import User from '../models/user.model.js';
import notificationService from '../services/notification.service.js';

const getAuthUserId = req =>
  String(
    req.user?._id || req.user?.id || req.admin?._id || req.admin?.id || ''
  );

const parseBoolean = value => {
  if (value === true || value === false) return value;
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
};

export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const result = await notificationService.listForDrawer({
      userId,
      page,
      limit,
      filters: {
        type: req.query.type,
        group: req.query.group,
        priority: req.query.priority,
        read: parseBoolean(req.query.read),
      },
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getNotificationSummary = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const data = await notificationService.unreadSummary({ userId });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const item = await notificationService.markRead({
      userId,
      notificationId: req.params.notificationId,
    });

    if (!item) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const modifiedCount = await notificationService.markAllRead({
      userId,
      group: req.body?.group || req.query?.group || null,
    });

    res.status(200).json({
      success: true,
      message: 'Notifications marked as read',
      data: { modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const deleted = await notificationService.deleteOne({
      userId,
      notificationId: req.params.notificationId,
    });

    if (!deleted) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const deletedCount = await notificationService.deleteAll({
      userId,
      group: req.body?.group || req.query?.group || null,
    });

    res.status(200).json({
      success: true,
      message: 'Notifications deleted',
      data: { deletedCount },
    });
  } catch (error) {
    next(error);
  }
};

export const sendDigestNow = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const frequency =
      String(
        req.body?.frequency || req.query?.frequency || 'daily'
      ).toLowerCase() === 'weekly'
        ? 'weekly'
        : 'daily';

    const data = await notificationService.sendDigest({ userId, frequency });

    res.status(200).json({
      success: true,
      message: data.sent
        ? `${frequency} digest sent`
        : `No pending ${frequency} digest notifications`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const scanPendingProposals = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const minHours = Number(req.body?.minHours || req.query?.minHours || 48);

    const created = await notificationService.scanPendingProposalNotifications({
      userId,
      minHours,
    });

    res.status(200).json({
      success: true,
      message: 'Proposal pending scan completed',
      data: {
        createdCount: created.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const scanBillingNotifications = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const created = await notificationService.scanBillingWindowNotifications({
      userId,
    });

    res.status(200).json({
      success: true,
      message: 'Billing notification scan completed',
      data: {
        createdCount: created.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const {
      emailEnabled,
      inAppEnabled,
      emailFrequency,
      instantHighPriorityOnly,
    } = req.body || {};

    const updates = {};
    if (typeof emailEnabled === 'boolean') {
      updates['notificationPreferences.emailEnabled'] = emailEnabled;
    }
    if (typeof inAppEnabled === 'boolean') {
      updates['notificationPreferences.inAppEnabled'] = inAppEnabled;
    }
    if (
      typeof emailFrequency === 'string' &&
      ['instant', 'daily', 'weekly'].includes(emailFrequency.toLowerCase())
    ) {
      updates['notificationPreferences.emailFrequency'] =
        emailFrequency.toLowerCase();
    }
    if (typeof instantHighPriorityOnly === 'boolean') {
      updates['notificationPreferences.instantHighPriorityOnly'] =
        instantHighPriorityOnly;
    }

    if (Object.keys(updates).length === 0) {
      const error = new Error('No valid preference values provided');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select('notificationPreferences')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: user?.notificationPreferences || null,
    });
  } catch (error) {
    next(error);
  }
};
