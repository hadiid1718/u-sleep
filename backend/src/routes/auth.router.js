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
} from '../controller/auth.controller.js';
import authorize from '../middleware/auth.middleware.js';

const authRouter = Router();

// User Auth Routes
authRouter.post('/sign-up', signUp);
authRouter.post('/sign-in', signIn);
authRouter.post('/sign-out', signOut);
authRouter.get('/google', startGoogleOAuth);
authRouter.get('/google/callback', handleGoogleOAuthCallback);

// Upwork OAuth Routes
authRouter.get('/upwork/connect', authorize, startUpworkOAuth);
authRouter.get('/upwork/callback', handleUpworkOAuthCallback);

// Freelancer OAuth Routes
authRouter.get('/freelancer/connect', startFreelancerOAuth);
authRouter.get('/freelancer/callback', handleFreelancerOAuthCallback);

export default authRouter;
