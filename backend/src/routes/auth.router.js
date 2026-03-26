import { Router } from 'express';
import {
  signIn,
  signOut,
  signUp,
  adminLogin,
  getAdminProfile,
  startUpworkOAuth,
  handleUpworkOAuthCallback,
} from '../controller/auth.controller.js';
import authorize from '../middleware/auth.middleware.js';

const authRouter = Router();

// User Auth Routes
authRouter.post('/sign-up', signUp);
authRouter.post('/sign-in', signIn);
authRouter.post('/sign-out', signOut);

// Upwork OAuth Routes
authRouter.get('/upwork/connect', authorize, startUpworkOAuth);
authRouter.get('/upwork/callback', handleUpworkOAuthCallback);

// Admin Auth Routes
authRouter.post('/admin/login', adminLogin);
authRouter.get('/admin/profile', authorize, getAdminProfile);

export default authRouter;
