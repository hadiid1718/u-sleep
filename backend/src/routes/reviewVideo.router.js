import { Router } from 'express';
import {
  uploadReviewVideo,
  getLatestReviewVideo,
  getAllReviewVideos,
  deleteReviewVideo,
  updateReviewVideo,
  setActiveReviewVideo,
} from '../controller/reviewVideo.controller.js';
import adminAuthorize from '../middleware/admin.middleware.js';

const reviewVideoRouter = Router();

// Public route - anyone can view the latest review video
reviewVideoRouter.get('/latest', getLatestReviewVideo);

// Admin routes - require authorization
reviewVideoRouter.post('/upload', adminAuthorize, uploadReviewVideo);
reviewVideoRouter.get('/all', adminAuthorize, getAllReviewVideos);
reviewVideoRouter.put('/:id', adminAuthorize, updateReviewVideo);
reviewVideoRouter.patch(
  '/:id/set-active',
  adminAuthorize,
  setActiveReviewVideo
);
reviewVideoRouter.delete('/:id', adminAuthorize, deleteReviewVideo);

export default reviewVideoRouter;
