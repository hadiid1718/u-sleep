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

const demoRouter = Router();

// Public routes
demoRouter.get('/available-dates', getAvailableDates);
demoRouter.get('/available-times/:date', getAvailableTimes);
demoRouter.post('/schedule', scheduleDemo);

// Admin routes
demoRouter.get('/all', getAllDemos);
demoRouter.get('/:id', getDemoById);
demoRouter.put('/:id/status', updateDemoStatus);
demoRouter.delete('/:id', cancelDemo);

export default demoRouter;
