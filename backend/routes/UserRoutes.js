const express = require('express');
const userRouter = express.Router()


const { registerUser } = require('../controllers/UserControllers');

 


userRouter.post('/register', registerUser);

module.exports = userRouter;