import { Router } from 'express';
import {
  deleteUser,
  flagUser,
  getMyDashboard,
  getUser,
  getUsers,
  updateMyNotificationMeta,
  updateMyPrompts,
  updateMySettings,
  updateUser,
} from '../controller/user.controller.js';
import authorize from '../middleware/auth.middleware.js';

const userRouter = Router();

userRouter.get('/', getUsers);

userRouter.get('/me/dashboard', authorize, getMyDashboard);
userRouter.patch('/me/settings', authorize, updateMySettings);
userRouter.patch('/me/prompts', authorize, updateMyPrompts);
userRouter.patch('/me/notifications', authorize, updateMyNotificationMeta);

userRouter.get('/:id', authorize, getUser);

userRouter.post('/', (req, res) => res.send({ title: 'Create User Route' }));

userRouter.put('/:id', authorize, updateUser);

userRouter.put('/:id/flag', authorize, flagUser);

userRouter.delete('/:id', authorize, deleteUser);

export default userRouter;
