import mongoose from "mongoose"
import User from "../models/user.model.js"
import Admin from "../models/admin.model.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { JWT_SECRET, JWT_EXPIRES_IN, ADMIN_USERNAME, ADMIN_PASSWORD } from "../config/env.js"

//----------------------- ADMIN_AUTH --------------------//

export const createDefaultAdmin = async () => {
  try {
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      throw new Error("ADMIN_USERNAME or ADMIN_PASSWORD missing in environment variables");
    }

    // Check if default admin already exists
    const existingAdmin = await Admin.findOne({ username: ADMIN_USERNAME });

    if (existingAdmin) {
      console.log(`Default admin already exists: ${ADMIN_USERNAME}`);
      return;
    }

    // Hash the default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Create default admin
    const defaultAdmin = await Admin.create({
      username: ADMIN_USERNAME,
      password: hashedPassword,
      role: "super_admin",
      isActive: true,
    });

    console.log(" Default admin created:", defaultAdmin.username);
  } catch (error) {
    console.error(" createDefaultAdmin error:", error.message);
  }
};

// Admin Login
export const adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      const error = new Error("Username and password are required");
      error.statusCode = 400;
      throw error;
    }

    // Find admin AND explicitly include password
    const admin = await Admin.findOne({ username }).select("+password");

    if (!admin) {
      const error = new Error("Invalid username or password");
      error.statusCode = 401;
      throw error;
    }

    // Check if admin is active
    if (!admin.isActive) {
      const error = new Error("Admin account is inactive");
      error.statusCode = 403;
      throw error;
    }

    // 🔥 SAFETY CHECK (prevents your error)
    if (!admin.password) {
      const error = new Error("Admin password not found. Contact system administrator.");
      error.statusCode = 500;
      throw error;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      const error = new Error("Invalid username or password");
      error.statusCode = 401;
      throw error;
    }

    // Generate token
    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: "Admin signed in successfully",
      data: {
        token,
        admin: {
          _id: admin._id,
          username: admin.username,
          role: admin.role,
          email: admin.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Admin Profile
export const getAdminProfile = async (req, res, next) => {
  try {
    // Extract adminId from the authenticated request (from auth middleware)
    const adminId = req.admin?._id || req.adminId;

    if (!adminId) {
      const error = new Error("Unauthorized - Admin ID not found");
      error.statusCode = 401;
      throw error;
    }

    const admin = await Admin.findById(adminId).select('-password');

    if (!admin) {
      const error = new Error("Admin not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Admin profile retrieved successfully",
      data: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};



//----------------------- User Auth ----------------------// 
//----------------------- User Auth ----------------------// 
//----------------------- User Auth ----------------------//


export const signUp = async(req,res,next)=> {
const session = await mongoose.startSession()
session.startTransaction();
  try{
    //Logic to create a new User
    const { name, email,password} = req.body;
    const existingUser = await User.findOne({ email })
    if(existingUser) {
        const error =  new Error("User already exist with this email")
        error.statusCode = 409
        throw error;
    }

    //Hahs Password
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(password,salt)

    const newUsers = await User.create([{name, email,password:hashedpassword}], { session })

    const token = jwt.sign(
      {userId: newUsers[0]._id},
      JWT_SECRET,
      {expiresIn: JWT_EXPIRES_IN})

    


    await session.commitTransaction()
    session.endSession()
    res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
            token,
            user: newUsers[0]
        }
    })
  }catch(error){
    await session.abortTransaction()
    session.endSession()
    next(error)
  }
}

export const signIn = async(req,res,next)=> {
   try{
    const { email, password } = req.body;
    const user = await User.findOne({ email})
    if(!user){
      const error = new Error("No user exist with this email")
      error.statusCode = 404
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if(!isPasswordValid){
      const error = new Error("Invalid password")
      error.statusCode = 401
      throw error;
    }
      const token = jwt.sign(
        { userId: user._id},
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      )

      res.status(200).json({
        success: true,
        message: "User signed in successfully",
        data: {
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email
          }
        }
      })
   } catch(error){
    next(error)
   }
}

export const signOut = async(req,res,next)=> {
 try{
  res.clearCookie("token")

res.status(200).json({
  success: true,
  message: "User signed out successfully"
})  // Invalidate the token on the client side by clearing it from storage
 } catch(error){
  next(error)
 }
}