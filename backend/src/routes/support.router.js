import { Router } from 'express';
import authorize from '../middleware/auth.middleware.js';
import {
  postUserMessage,
  getUserMessages,
  adminListUserMessages,
  adminPostReply,
  adminListAllChats,
  adminMarkAsRead,
} from '../controller/support.controller.js';
import adminAuthorize from '../middleware/admin.middleware.js';

const supportRouter = Router();

// User endpoints
supportRouter.get('/chats', authorize, getUserMessages);
supportRouter.post('/chats', authorize, postUserMessage);

// Admin endpoints
supportRouter.get('/admin/chats', adminAuthorize, adminListAllChats);
supportRouter.get('/chats/:userId', adminAuthorize, adminListUserMessages);
supportRouter.post('/chats/:userId/reply', adminAuthorize, adminPostReply);
supportRouter.patch('/chats/:userId/read', adminAuthorize, adminMarkAsRead);

export default supportRouter;
