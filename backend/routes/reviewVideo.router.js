import { Router } from 'express';
import {
  uploadReviewVideo,
  getLatestReviewVideo,
  getAllReviewVideos,
  deleteReviewVideo,
  updateReviewVideo,
  setActiveReviewVideo,
} from '../controller/reviewVideo.controller.js';
import authorize from '../middleware/auth.middleware.js';

const reviewVideoRouter = Router();

// Public route - anyone can view the latest review video
reviewVideoRouter.get('/latest', getLatestReviewVideo);

// Admin routes - require authorization
reviewVideoRouter.post('/upload', authorize, uploadReviewVideo);
reviewVideoRouter.get('/all', authorize, getAllReviewVideos);
reviewVideoRouter.put('/:id', authorize, updateReviewVideo);
reviewVideoRouter.patch('/:id/set-active', authorize, setActiveReviewVideo);
reviewVideoRouter.delete('/:id', authorize, deleteReviewVideo);

export default reviewVideoRouter;
