import { Router } from 'express';
import authorize from '../middleware/auth.middleware.js';
import {
  postUserMessage,
  getUserMessages,
  postContactMessage,
} from '../controller/support.controller.js';

const supportRouter = Router();

// User endpoints
supportRouter.get('/chats', authorize, getUserMessages);
supportRouter.post('/chats', authorize, postUserMessage);

supportRouter.post('/contact', postContactMessage);

// Admin support removed — no admin routes for support

export default supportRouter;
