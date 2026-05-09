import { Router } from 'express';
import authorize from '../middleware/auth.middleware.js';
import { checkAccountStatus as _checkAccountStatus } from '../middleware/suspensionCheck.middleware.js';
import {
  submitSuspensionAppeal,
  getUserAppeals,
  getAppealDetails,
  addAppealReply,
  getAllAppeals,
  reviewAppeal,
} from '../controller/suspension.controller.js';
import {
  getActiveTerms,
  getTermsByVersion,
  acceptTerms,
  checkTermsAcceptance,
  createUpdateTerms,
  getAllTermsVersions,
  addViolationRule,
} from '../controller/terms.controller.js';

const suspensionRouter = Router();

// ==========================================
// TERMS AND CONDITIONS ROUTES
// ==========================================

// Public - Get active terms
suspensionRouter.get('/terms/active', getActiveTerms);

// Public - Get terms by version
suspensionRouter.get('/terms/version/:version', getTermsByVersion);

// User - Accept terms
suspensionRouter.post('/terms/accept', authorize, acceptTerms);

// User - Check terms acceptance status
suspensionRouter.get('/terms/check', authorize, checkTermsAcceptance);

// ==========================================
// SUSPENSION APPEAL ROUTES
// ==========================================

// User - Submit suspension appeal (allowed for suspended users)
suspensionRouter.post('/appeal/submit', authorize, submitSuspensionAppeal);

// User - Get all my appeals
suspensionRouter.get('/appeals/my', authorize, getUserAppeals);

// User - Get specific appeal details
suspensionRouter.get('/appeal/:appealId', authorize, getAppealDetails);

// User - Add reply to appeal
suspensionRouter.post('/appeal/:appealId/reply', authorize, addAppealReply);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Admin - Get all appeals with filtering
suspensionRouter.get('/admin/appeals', authorize, getAllAppeals);

// Admin - Review and respond to appeal
suspensionRouter.post(
  '/admin/appeal/:appealId/review',
  authorize,
  reviewAppeal
);

// Admin - Create/Update Terms and Conditions
suspensionRouter.post('/admin/terms', authorize, createUpdateTerms);

// Admin - Get all terms versions
suspensionRouter.get('/admin/terms/versions', authorize, getAllTermsVersions);

// Admin - Add violation rule
suspensionRouter.post(
  '/admin/terms/:version/rule',
  authorize,
  addViolationRule
);

export default suspensionRouter;
