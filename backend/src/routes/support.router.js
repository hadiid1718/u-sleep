import { Router } from 'express';
import authorize from '../middleware/auth.middleware.js';
import {
  postUserMessage,
  getUserMessages,
} from '../controller/support.controller.js';

const supportRouter = Router();

// User endpoints
supportRouter.get('/chats', authorize, getUserMessages);
supportRouter.post('/chats', authorize, postUserMessage);

// Admin support removed — no admin routes for support

export default supportRouter;
