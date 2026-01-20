const User = require("../models/User");
const { generateToken } = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide the required fields",
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
        error: true,
      });
    }

    // Create a new user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });
    console.log(newUser);

    // Generate tokens
    const tokenPayloads = {
      id: newUser._id,
      email: newUser.email,
      role: "user",
    };

    const tokens = generateToken(tokenPayloads);

    // Save refresh token & update login
    newUser.refreshToken = tokens.refreshToken;
    await newUser.save();

    if (typeof newUser.updateLastLogin === "function") {
      await newUser.updateLastLogin();
    }

    // Response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: newUser,
        tokens,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Generate tokens
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: "user",
    };
    const tokens = generateToken(tokenPayload);

    // Save refresh token & update last login
    user.refreshToken = tokens.refreshToken;
    await user.save();
    await user.updateLastLogin();

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        tokens,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while logging in",
    });
  }
};

const loginwithGoogle = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google Token is required",
      });
    }
    
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email not provided by Google",
      });
    }

    // Check if user exists
    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    // FIX: Track if this is a new user BEFORE saving
    const isNewUser = !user;

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      user.emailVerified = true;
    } else {
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        avatar: picture,
        emailVerified: true,
      });
    }

    // Generate tokens
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: "user",
    };
    const tokens = generateToken(tokenPayload);

    user.refreshToken = tokens.refreshToken;
    await user.save();
    await user.updateLastLogin();

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: "Google Login Successful",
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    console.error("Google login error", error);

    if (error.message.includes("Token used too late")) {
      return res.status(401).json({
        success: false,
        message: "Google token expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Google Authentication failed",
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const user = req.user;
    // Clear refresh token
    user.refreshToken = null;
    await user.save();
    res.status(200).json({
      success: true,
      message: "User logout Successfully",
    });
  } catch (error) {
    console.error("Logout error", error);
    res.status(500).json({
      success: false,
      message: "Internal server error", // FIX: typo
    });
  }
};

// Get all users - admin only
const getUser = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      isActive,
    } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select("-password -refreshToken"),
      User.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalUsers,
          hasNextPage,
          hasPrevPage,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("Get User Error", error);
    res.status(500).json({
      success: false,
      message: "Internal Server error",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      message: "User Profile Retrieved Successfully",
      data: { user }, // FIX: was "date"
    });
  } catch (error) {
    console.error("Get current user error", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    const user = req.user;
    
    if (name) user.name = name.trim();
    if (email) user.email = email.trim();
    if (avatar) user.avatar = avatar;

    await user.save();
    
    res.status(200).json({
      success: true,
      message: "Profile Updated successfully",
      data: { user }
    });

  } catch (error) {
    console.error("Profile update error", error);
    
    // FIX: Use 'error' not 'err'
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginwithGoogle,
  logoutUser,
  getUser,
  getCurrentUser,
  updateUserProfile
};