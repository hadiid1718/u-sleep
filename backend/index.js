const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
require("dotenv").config();


const { Configuration, OpenAIApi } = require("openai");

// Routes Importing
const adminRouter = require("./routes/AdminRoutes");
const userRouter = require("./routes/UserRoutes");
const db = require("./config/database")
const app = express();

// Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE"], 
  })
);

  db.execute("SELECT * FROM users").then(([rows, fields])=> {
   console.log("Database data", rows)
  }).catch(error =>{
    console.log("Error", error)
  })
// Logging
app.use(morgan("combined"));

// Body Parsing Middlewares
app.use(bodyParser.json({ limit: "30mb" }));
app.use(express.json())
app.use(
  express.urlencoded({
    extended: true,
    limit: "30mb",
  })
);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API ROUTES
app.use("/api/admin", adminRouter); // FIX: typo in "admiin"
app.use("/api/user", userRouter);

// Handling 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  console.error("Stack:", err.stack);

  // Validation Error
  if (err.name === "ValidationError") { // FIX: correct capitalization
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
  }

  // JWT ERROR
  if (err.name === "JsonWebTokenError") { // FIX: correct error name
    return res.status(401).json({
      success: false,
      message: "Invalid Token, Unauthorized Access",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token Expired, Unauthorized Access",
    });
  }

  // DEFAULT ERROR
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
connectDB()
// Server Listener
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('connect to DB')
});
