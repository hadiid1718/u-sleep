import { Router } from 'express';
import {
  generateProposal,
  getProposal,
  getUserProposals,
  sendProposal,
  updateProposalStatus,
  upgradeProposal,
  copyProposal,
  rateProposal,
  deleteProposal,
  getProposalStats,
  getTopTemplates,
  getJobCategoryPerformance,
} from '../controller/proposal.controller.js';
import authorize from '../middleware/auth.middleware.js';

const proposalRouter = Router();

// Order matters - place more specific routes before generic ones

/**
 * GET /api/v1/proposals/stats/summary
 * Get proposal statistics
 */
proposalRouter.get('/stats/summary', authorize, getProposalStats);

/**
 * GET /api/v1/proposals/stats/top-templates
 * Get top performing templates by acceptance rate
 */
proposalRouter.get('/stats/top-templates', authorize, getTopTemplates);

/**
 * GET /api/v1/proposals/stats/category-performance
 * Get job category performance
 */
proposalRouter.get(
  '/stats/category-performance',
  authorize,
  getJobCategoryPerformance
);

/**
 * GET /api/v1/proposals
 * Get all proposals for user
 * Query params: page, limit, status, sortBy
 */
proposalRouter.get('/', authorize, getUserProposals);

/**
 * POST /api/v1/proposals/job/:jobId/generate
 * Generate proposal for a job
 * Non-blocking operation
 */
proposalRouter.post('/job/:jobId/generate', authorize, generateProposal);

/**
 * GET /api/v1/proposals/:proposalId
 * Get single proposal details
 */
proposalRouter.get('/:proposalId', authorize, getProposal);

/**
 * POST /api/v1/proposals/:proposalId/send
 * Send proposal to Upwork
 */
proposalRouter.post('/:proposalId/send', authorize, sendProposal);

/**
 * PATCH /api/v1/proposals/:proposalId/status
 * Update proposal status
 * Body: { status, notes }
 */
proposalRouter.patch('/:proposalId/status', authorize, updateProposalStatus);

/**
 * POST /api/v1/proposals/:proposalId/upgrade
 * Upgrade proposal with case study
 * Body: { caseStudy }
 */
proposalRouter.post('/:proposalId/upgrade', authorize, upgradeProposal);

/**
 * POST /api/v1/proposals/:proposalId/copy
 * Get proposal content for copying
 */
proposalRouter.post('/:proposalId/copy', authorize, copyProposal);

/**
 * POST /api/v1/proposals/:proposalId/rate
 * Rate proposal quality
 * Body: { rating, feedback }
 */
proposalRouter.post('/:proposalId/rate', authorize, rateProposal);

/**
 * DELETE /api/v1/proposals/:proposalId
 * Delete proposal
 */
proposalRouter.delete('/:proposalId', authorize, deleteProposal);

export default proposalRouter;
