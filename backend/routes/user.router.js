import { Router } from 'express';
import {
  deleteUser,
  flagUser,
  getUser,
  getUsers,
  updateUser,
} from '../controller/user.controller.js';
import authorize from '../middleware/auth.middleware.js';

const userRouter = Router();

userRouter.get('/', getUsers);

userRouter.get('/:id', authorize, getUser);

userRouter.post('/', (req, res) => res.send({ title: 'Create User Route' }));

userRouter.put('/:id', authorize, updateUser);

userRouter.put('/:id/flag', authorize, flagUser);

userRouter.delete('/:id', authorize, deleteUser);

export default userRouter;
