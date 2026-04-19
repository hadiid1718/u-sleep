import { Router } from 'express';
import authorize from '../middleware/auth.middleware.js';
import {
  deleteAllNotifications,
  deleteNotification,
  getMyNotifications,
  getNotificationSummary,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  scanBillingNotifications,
  scanPendingProposals,
  sendDigestNow,
  updateNotificationPreferences,
} from '../controller/notification.controller.js';

const notificationRouter = Router();

notificationRouter.get('/', authorize, getMyNotifications);
notificationRouter.get('/summary', authorize, getNotificationSummary);
notificationRouter.patch('/read-all', authorize, markAllNotificationsAsRead);
notificationRouter.patch(
  '/:notificationId/read',
  authorize,
  markNotificationAsRead
);
notificationRouter.delete('/all', authorize, deleteAllNotifications);
notificationRouter.delete('/:notificationId', authorize, deleteNotification);

notificationRouter.post('/digest/send', authorize, sendDigestNow);
notificationRouter.post(
  '/sync/proposals-pending',
  authorize,
  scanPendingProposals
);
notificationRouter.post('/sync/billing', authorize, scanBillingNotifications);
notificationRouter.patch(
  '/preferences',
  authorize,
  updateNotificationPreferences
);

export default notificationRouter;
