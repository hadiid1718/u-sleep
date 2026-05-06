import SupportChat from '../models/supportChat.model.js';
import User from '../models/user.model.js';
import nodemailerConfig from '../config/nodemailer.js';

const CHAT_RETENTION_MINUTES = 10;
const CHAT_RETENTION_MS = CHAT_RETENTION_MINUTES * 60 * 1000;
const DEFAULT_ADMIN_CHAT_LIMIT = 10;
const DEFAULT_ADMIN_MESSAGE_LIMIT = 20;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getConversationWindow = (latestMessage) => {
  if (!latestMessage?.createdAt) {
    return {
      expired: true,
      expiresAt: null,
      remainingMs: 0,
    };
  }

  const latestCreatedAt = new Date(latestMessage.createdAt).getTime();
  const expiresAt = new Date(latestCreatedAt + CHAT_RETENTION_MS);
  const remainingMs = expiresAt.getTime() - Date.now();

  return {
    expired: remainingMs <= 0,
    expiresAt: expiresAt.toISOString(),
    remainingMs: Math.max(remainingMs, 0),
  };
};

const generateAutoReply = (text) => {
  const t = String(text || '').toLowerCase();
  if (!t) return 'Thanks — I will review and reply shortly.';
  if (t.includes('price') || t.includes('plan') || t.includes('billing')) {
    return 'Thanks for asking about pricing. Please share your use case and I will suggest a plan shortly.';
  }
  if (t.includes('bug') || t.includes('error') || t.includes('issue')) {
    return 'Sorry you ran into an issue. Please include a screenshot or steps and I will investigate.';
  }
  if (t.includes('demo') || t.includes('call')) {
    return 'You can schedule a demo from the dashboard — I will follow up here to confirm.';
  }
  return 'Thanks for your message — I will personally review and reply shortly.';
};

const generateAdminFollowUp = (text) => {
  const t = String(text || '').toLowerCase();
  if (!t) return 'A member of the team will reply shortly.';
  if (t.includes('urgent') || t.includes('asap')) {
    return 'Your message has been marked urgent. A member of the team will reply as soon as possible.';
  }
  return 'Thanks for the update. We will continue the conversation here and keep you posted.';
};

const sendEmailNotification = async (user, message) => {
  try {
    if (!user?.email) return;

    await nodemailerConfig.sendMail({
      to: user.email,
      subject: '[U Sleep] New Support Message',
      html: `
        <p>Hi ${user.name || 'there'},</p>
        <p>You have received a new message from our support team.</p>
        <blockquote style="border-left: 4px solid #a3e635; padding-left: 12px; color: #666;">
          ${String(message).replace(/\n/g, '<br />')}
        </blockquote>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/dashboard">View in Dashboard</a></p>
        <p>Best,<br />The U Sleep Team</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send support notification email:', error);
  }
};

export const postUserMessage = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { message } = req.body;
    const io = req.app?.locals?.io;

    if (!userId) {
      const err = new Error('User not authenticated');
      err.statusCode = 401;
      throw err;
    }

    if (!message || !String(message).trim()) {
      const err = new Error('Message is required');
      err.statusCode = 400;
      throw err;
    }

    const userMsg = await SupportChat.create({
      userId,
      sender: 'user',
      message: String(message).trim(),
      auditTrail: {
        createdBy: String(userId),
      },
    });

    // create an auto-reply (system/founder) so users see immediate feedback
    const auto = generateAutoReply(message);
    const autoMsg = await SupportChat.create({
      userId,
      sender: 'founder',
      message: auto,
      isAutoReply: true,
      auditTrail: {
        createdBy: 'system',
      },
    });

    // Emit Socket.IO event to notify admins
    if (io) {
      const user = await User.findById(userId).select('name email');
      io.to('admins').emit('support-chat:new-user-message', {
        userId: String(userId),
        userName: user?.name || user?.email || 'User',
        message: String(message).trim(),
        timestamp: new Date(),
        messageId: String(userMsg._id),
      });
    }

    res.status(201).json({
      success: true,
      data: {
        messages: [userMsg, autoMsg],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserMessages = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      const err = new Error('User not authenticated');
      err.statusCode = 401;
      throw err;
    }

    const latestMessage = await SupportChat.findOne({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .select('createdAt')
      .lean();

    const window = getConversationWindow(latestMessage);

    if (window.expired) {
      res.status(200).json({
        success: true,
        data: {
          messages: [],
          meta: {
            expired: true,
            expiresAt: window.expiresAt,
            retentionMinutes: CHAT_RETENTION_MINUTES,
          },
          pagination: {
            total: 0,
            page: 1,
            limit: 0,
            pages: 0,
          },
        },
      });

      return;
    }

    const messages = await SupportChat.find({ userId, isActive: true })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        messages,
        meta: {
          expired: false,
          expiresAt: window.expiresAt,
          retentionMinutes: CHAT_RETENTION_MINUTES,
          remainingMs: window.remainingMs,
        },
        pagination: {
          total: messages.length,
          page: 1,
          limit: messages.length,
          pages: 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: list messages for a specific user
export const adminListUserMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, DEFAULT_ADMIN_MESSAGE_LIMIT);

    if (!userId) {
      const err = new Error('userId is required');
      err.statusCode = 400;
      throw err;
    }

    const filter = { userId };
    const total = await SupportChat.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;

    const messages = await SupportChat.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          total,
          page: currentPage,
          limit,
          pages: totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: post a reply from admin/founder
export const adminPostReply = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    const adminId = req.admin?.id || req.admin?._id;
    const io = req.app?.locals?.io;

    if (!userId) {
      const err = new Error('userId is required');
      err.statusCode = 400;
      throw err;
    }

    if (!message || !String(message).trim()) {
      const err = new Error('Message is required');
      err.statusCode = 400;
      throw err;
    }

    const adminMsg = await SupportChat.create({
      userId,
      sender: 'admin',
      message: String(message).trim(),
      adminId: String(adminId),
      auditTrail: {
        createdBy: String(adminId),
      },
    });

    const systemMsg = await SupportChat.create({
      userId,
      sender: 'system',
      message: generateAdminFollowUp(message),
      isAutoReply: true,
      auditTrail: {
        createdBy: 'system',
      },
    });

    // Emit Socket.IO event to notify the user
    if (io) {
      io.to(`user:${userId}`).emit('support-chat:new-admin-reply', {
        message: String(message).trim(),
        sender: 'admin',
        timestamp: new Date(),
        messageId: String(adminMsg._id),
      });

      io.to(`user:${userId}`).emit('support-chat:new-system-reply', {
        message: systemMsg.message,
        sender: 'system',
        timestamp: new Date(),
        messageId: String(systemMsg._id),
      });

      // Notify all admins
      io.to('admins').emit('support-chat:admin-reply-sent', {
        adminId: String(adminId),
        userId,
        message: String(message).trim(),
        timestamp: new Date(),
      });
    }

    // Send email notification to user
    const user = await User.findById(userId);
    await sendEmailNotification(user, String(message).trim());

    res.status(201).json({ success: true, data: { messages: [adminMsg, systemMsg] } });
  } catch (error) {
    next(error);
  }
};

// Admin: list all active support chats (with latest message)
export const adminListAllChats = async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, DEFAULT_ADMIN_CHAT_LIMIT);

    // Admin should see every support conversation, even if it is older than the user-facing retention window.
    const pipeline = [
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          latestMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] },
          },
        },
      },
      { $sort: { 'latestMessage.createdAt': -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
    ];

    const chats = await SupportChat.collection.aggregate(pipeline).toArray();

    const formatted = chats.map((chat) => ({
      userId: String(chat._id),
      userName:
        chat.userInfo?.[0]?.name ||
        chat.userInfo?.[0]?.email ||
        'Unknown User',
      userEmail: chat.userInfo?.[0]?.email || '',
      latestMessage: chat.latestMessage?.message || '',
      latestSender: chat.latestMessage?.sender || '',
      latestTimestamp: chat.latestMessage?.createdAt || new Date(),
      unreadCount: chat.unreadCount || 0,
    }));

    // Get total unique users across all support conversations
    const uniqueUsers = await SupportChat.distinct('userId');
    const total = uniqueUsers.length;

    res.status(200).json({
      success: true,
      data: {
        chats: formatted,
        pagination: {
          total,
          page,
          limit,
          pages: Math.max(Math.ceil(total / limit), 1),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: mark messages as read
export const adminMarkAsRead = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      const err = new Error('userId is required');
      err.statusCode = 400;
      throw err;
    }

    const result = await SupportChat.updateMany(
      { userId, sender: { $ne: 'admin' }, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  postUserMessage,
  getUserMessages,
  adminListUserMessages,
  adminPostReply,
  adminListAllChats,
  adminMarkAsRead,
};
