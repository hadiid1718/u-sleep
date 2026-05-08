import SupportChat from '../models/supportChat.model.js';
import aiService from '../services/ai.service.js';

const CHAT_RETENTION_MINUTES = 10;
const CHAT_RETENTION_MS = CHAT_RETENTION_MINUTES * 60 * 1000;

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

const AI_QUICK_TIMEOUT_MS = 7000;
const AI_BACKGROUND_TIMEOUT_MS = 45000; // Longer timeout for background processing
const SUPPORT_CHAT_AI_PROVIDER = 'gemini';

const withTimeout = (promise, timeoutMs, label = 'Operation timed out') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label)), timeoutMs)),
  ]);
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

    const configuredProvider = aiService.resolveProposalProvider(SUPPORT_CHAT_AI_PROVIDER);
    if (configuredProvider !== SUPPORT_CHAT_AI_PROVIDER) {
      res.status(503).json({
        success: false,
        error: {
          message: 'Gemini AI chat is not configured. Please set GOOGLE_GEMINI_API_KEY and retry.',
        },
        data: {
          messages: [userMsg],
        },
      });
      return;
    }

    // Attempt to generate AI reply quickly; if AI is slow or fails, schedule background generation.
    let aiReplyPayload = null;
    try {
      aiReplyPayload = await withTimeout(
        aiService.generateChatReply({
          message,
          aiService: SUPPORT_CHAT_AI_PROVIDER,
          maxTokens: 500,
        }),
        AI_QUICK_TIMEOUT_MS,
        'AI timeout'
      );
    } catch {
      // schedule background processing so the user's experience isn't blocked
      setTimeout(async () => {
        try {
          const text = await withTimeout(
            aiService.generateChatReply({
              message,
              aiService: SUPPORT_CHAT_AI_PROVIDER,
              maxTokens: 500,
            }),
            AI_BACKGROUND_TIMEOUT_MS,
            'AI background processing timed out'
          );

          if (!text || !text.trim()) {
            throw new Error('AI generated empty response');
          }

          const bgMsg = await SupportChat.create({
            userId,
            sender: 'system',
            message: text,
            isAutoReply: false,
            metadata: {
              aiGenerated: true,
              provider: SUPPORT_CHAT_AI_PROVIDER,
            },
            auditTrail: { createdBy: 'system' },
          });

          if (io) {
            io.to(`user:${userId}`).emit('support-chat:new-system-reply', {
              message: bgMsg.message,
              sender: 'system',
              timestamp: new Date(),
              messageId: String(bgMsg._id),
            });
          }
        } catch (e) {
          console.error('Background AI reply generation failed:', e);
          if (io) {
            io.to(`user:${userId}`).emit('support-chat:ai-error', {
              message: 'AI took too long to respond. Please try again or contact support.',
              timestamp: new Date(),
            });
          }
        }
      }, 0);

      // Respond 202 Accepted to indicate processing
      res.status(202).json({
        success: true,
        data: {
          processing: true,
          messages: [userMsg],
          info: 'AI response is being generated and will arrive shortly.',
        },
      });
      return;
    }

    // If we have AI text, save and emit immediately
    const autoMsg = await SupportChat.create({
      userId,
      sender: 'system',
      message: aiReplyPayload,
      isAutoReply: false,
      metadata: {
        aiGenerated: true,
        provider: SUPPORT_CHAT_AI_PROVIDER,
      },
      auditTrail: {
        createdBy: 'system',
      },
    });

    res.status(201).json({ success: true, data: { messages: [userMsg, autoMsg] } });
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

export default {
  postUserMessage,
  getUserMessages,
};
