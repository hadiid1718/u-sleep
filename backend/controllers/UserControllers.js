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
    console.log(newUser)

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

module.exports = {
  registerUser,
};
