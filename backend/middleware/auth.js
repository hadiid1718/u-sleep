const jwt= require('jsonwebtoken');
const User = require("../models/User")








//GENERATING TOKEN

const generateToken = (payload)=> {
 const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',

 })
 const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_KEY, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
 })
 return { token, refreshToken}
}

//JWT  TOKEN VERIFICATION

const verifyToken =(token, secret) => {
return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
        if(err) return reject(err);
        resolve(decoded);
    });
});
};

// user authentication middleware

const authenticateUser = async (req, res, next) => {
      try {
    const authHeader = req.header('Authorization');
    if(!authHeader || !authHeader.startWith('Bearer ')){
        return res.status(401).json({
            success: false,
            message: "Tokn is missing or Invalid token",
        })
        const token = authHeader.substring(7);
        const decoded = await verifyToken(token, process.env.JWT_SECRET_KEY);
   } const user = await User.findById(decoded.id).select('-password -refreshToken')
   if(!user || !user.isActive){
    return res.status(401).json({
        success: false,
        message: "User not found or inactive",
    })
   }
   req.user = user;
    next();
}catch (error) {
     if(error.name === 'TokenExpiredError'){
        return res.status(401).json({
            success: false,
            message: "Token is expired",
        })
   }
   return  res.status(401).json({
    success: false,
    message: "Invalid token",

   })
}
}
 
// admin authenticate middleware

const authenticateAdmin = async (req, res, next) => {}

module.exports = {
    generateToken,
    verifyToken,
    authenticateUser,
    authenticateAdmin
}