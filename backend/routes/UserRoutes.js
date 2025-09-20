const express = require('express');
const userRouter = express.Router()


const { registerUser, loginUser, loginwithGoogle, logoutUser, getCurrentUser, updateUserProfile } = require('../controllers/UserControllers');
const { authenticateUser} = require("../middleware/auth")

 


userRouter.post('/register', registerUser);
userRouter.post("/login", loginUser)
userRouter.post("/google-login", loginwithGoogle)

//Protected routes

userRouter.post("/logout",authenticateUser, logoutUser)
userRouter.get("get-current-user", authenticateUser, getCurrentUser)
userRouter.put("/update-profile", authenticateUser, updateUserProfile)

module.exports = userRouter;