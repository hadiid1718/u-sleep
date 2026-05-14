import { Router } from 'express';
import adminAuthorize from '../middleware/admin.middleware.js';
import {
  getAvailableDates,
  getAvailableTimes,
  scheduleDemo,
  getAllDemos,
  getDemoById,
  updateDemoStatus,
  cancelDemo,
  sendDemoMail,
} from '../controller/demo.controller.js';

const demoRouter = Router();

// Public routes
demoRouter.get('/available-dates', getAvailableDates);
demoRouter.get('/available-times/:date', getAvailableTimes);
demoRouter.post('/schedule', scheduleDemo);

// Admin routes
demoRouter.get('/all', adminAuthorize, getAllDemos);
demoRouter.post('/:id/send-mail', adminAuthorize, sendDemoMail);
demoRouter.get('/:id', adminAuthorize, getDemoById);
demoRouter.put('/:id/status', adminAuthorize, updateDemoStatus);
demoRouter.delete('/:id', adminAuthorize, cancelDemo);

export default demoRouter;
