const express = require("express");
const demoRouter = express.Router();
const { body } = require("express-validator");
const {
  availableDates,
  availableTimeSlots,
  scheduleDemo,
  getAllDemos,
  getDemoById,
  updateDemo,
  cancelDemo,
} = require("../controllers/DemoController");

// Validation middleware
const validateScheduleDemo = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format"),
  body("time").notEmpty().withMessage("Time is required"),
  body("name").optional().trim().escape(),
  body("company").optional().trim().escape(),
  body("phone").optional().trim(),
  body("notes").optional().trim(),
];

// Public routes
demoRouter.get("/available-dates", availableDates);
demoRouter.get("/available-times/:date", availableTimeSlots);
demoRouter.post("/schedule-demo", validateScheduleDemo, scheduleDemo);

// Admin routes (you can add authentication middleware here)
demoRouter.get("/demos", getAllDemos);
demoRouter.get("/demos/:id", getDemoById);
demoRouter.put("/demos/:id", updateDemo);
demoRouter.delete("/demos/:id", cancelDemo);

module.exports = demoRouter;