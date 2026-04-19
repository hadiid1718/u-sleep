import { Router } from 'express';
import adminAuthorize from '../middleware/admin.middleware.js';
import {
  getAdminSession,
  getAdminMetrics,
  listUsers,
  updateUser,
  updateUserStatus,
  deleteUser,
  listCases,
  createCase,
  resolveCase,
  getViolationSettings,
  updateViolationSettings,
} from '../controller/admin.controller.js';

const adminRouter = Router();

adminRouter.get('/me', adminAuthorize, getAdminSession);
adminRouter.get('/metrics', adminAuthorize, getAdminMetrics);

adminRouter.get('/users', adminAuthorize, listUsers);
adminRouter.patch('/users/:userId', adminAuthorize, updateUser);
adminRouter.patch('/users/:userId/status', adminAuthorize, updateUserStatus);
adminRouter.delete('/users/:userId', adminAuthorize, deleteUser);

adminRouter.get('/cases', adminAuthorize, listCases);
adminRouter.post('/cases', adminAuthorize, createCase);
adminRouter.patch('/cases/:caseId/resolve', adminAuthorize, resolveCase);

adminRouter.get('/settings/violations', adminAuthorize, getViolationSettings);
adminRouter.put('/settings/violations', adminAuthorize, updateViolationSettings);

export default adminRouter;
