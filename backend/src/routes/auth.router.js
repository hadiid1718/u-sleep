import { Router } from 'express';
import {
  signIn,
  signOut,
  signUp,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  startUpworkOAuth,
  handleUpworkOAuthCallback,
  startFreelancerOAuth,
  handleFreelancerOAuthCallback,
  refreshFreelancerToken,
  adminSignIn,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from '../controller/auth.controller.js';
import authorize from '../middleware/auth.middleware.js';

const authRouter = Router();

// User Auth Routes
authRouter.post('/sign-up', signUp);
authRouter.post('/sign-in', signIn);
authRouter.post('/sign-out', signOut);
authRouter.get('/verify-email', verifyEmail);
authRouter.post('/resend-verification', resendVerificationEmail);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/admin/sign-in', adminSignIn);
authRouter.get('/google', startGoogleOAuth);
authRouter.get('/google/callback', handleGoogleOAuthCallback);

// Upwork OAuth Routes
authRouter.get('/upwork/connect', authorize, startUpworkOAuth);
authRouter.get('/upwork/callback', handleUpworkOAuthCallback);

// Freelancer OAuth Routes
authRouter.get('/freelancer/connect', startFreelancerOAuth);
authRouter.get('/freelancer/callback', handleFreelancerOAuthCallback);
authRouter.post('/freelancer/refresh', authorize, refreshFreelancerToken);

export default authRouter;
