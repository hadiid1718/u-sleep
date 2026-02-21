import { Router } from 'express';
import {
    searchJobs,
    getFilteredJobs,
    getJobDetail,
    markJobAsMatched,
    markJobAsRejected,
    searchJobsWithAIAnalysis,
} from '../controller/job.controller.js';
import authorize from '../middleware/auth.middleware.js';

const jobRouter = Router();

/**
 * POST /api/v1/jobs/search
 * Search jobs from Upwork API
 * Non-blocking operation
 */
jobRouter.post('/search', authorize, searchJobs);

/**
 * POST /api/v1/jobs/search-with-ai
 * Search jobs with AI analysis and scoring
 */
jobRouter.post('/search-with-ai', authorize, searchJobsWithAIAnalysis);

/**
 * GET /api/v1/jobs/filtered
 * Get filtered and cached jobs for user
 * Query params: page, limit, status
 */
jobRouter.get('/filtered', authorize, getFilteredJobs);

/**
 * GET /api/v1/jobs/:jobId
 * Get single job details
 */
jobRouter.get('/:jobId', authorize, getJobDetail);

/**
 * PUT /api/v1/jobs/:jobId/match
 * Mark job as matched
 */
jobRouter.put('/:jobId/match', authorize, markJobAsMatched);

/**
 * PUT /api/v1/jobs/:jobId/reject
 * Mark job as rejected with feedback
 */
jobRouter.put('/:jobId/reject', authorize, markJobAsRejected);

export default jobRouter;
