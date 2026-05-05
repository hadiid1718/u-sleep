import { Router } from 'express';
import {
  getAvailableDates,
  getAvailableTimes,
  scheduleDemo,
  getAllDemos,
  getDemoById,
  updateDemoStatus,
  cancelDemo,
} from '../controller/demo.controller.js';
import authorize from '../middleware/auth.middleware.js';

const demoRouter = Router();

// Public routes
demoRouter.get('/available-dates', getAvailableDates);
demoRouter.get('/available-times/:date', getAvailableTimes);
demoRouter.post('/schedule', scheduleDemo);

// Admin routes
demoRouter.get('/all', authorize, getAllDemos);
demoRouter.get('/:id', authorize, getDemoById);
demoRouter.put('/:id/status', authorize, updateDemoStatus);
demoRouter.delete('/:id', authorize, cancelDemo);

export default demoRouter;
