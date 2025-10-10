const Demo = require("../models/demoSchedule");

// Helper function to generate dates
const getAvailableDates = () => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push({
        day: date.getDate(),
        month: date.toLocaleDateString("en-US", { month: "short" }),
        year: date.getFullYear(),
        fullDate: date.toISOString().split("T")[0],
      });
    }
  }
  return dates;
};

const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
];

// Get available dates
const availableDates = async (req, res) => {
  try {
    const dates = getAvailableDates();
    res.json({
      success: true,
      data: dates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      error: error.message,
    });
  }
};

// Get available time slots for a specific date
const availableTimeSlots = async (req, res) => {
  try {
    const { date } = req.params;
    
    const bookedDemos = await Demo.find({
      date,
      status: "scheduled",
    }).select("time");
    
    const bookedTimes = new Set(bookedDemos.map((demo) => demo.time));

    const availableTimes = timeSlots.map((time) => ({
      time,
      available: !bookedTimes.has(time),
    }));
    
    res.json({
      success: true,
      data: availableTimes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Schedule a new demo
const scheduleDemo = async (req, res) => {
  try {
    const { email, date, time, name, company, phone, notes } = req.body;

    // Validate required fields
    if (!email || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Email, date, and time are required fields",
      });
    }

    // Check if the slot is already booked
    const existingDemo = await Demo.findOne({
      date,
      time,
      status: "scheduled",
    });

    if (existingDemo) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked. Please select another time for demo.",
      });
    }

    // Parse the date
    const [year, month, day] = date.split("-");
    const fullDate = new Date(year, month - 1, day);

    // Create new demo booking
    const newDemo = new Demo({
      email,
      name,
      company,
      phone,
      date,
      time,
      fullDate,
      notes,
      status: "scheduled",
    });

    await newDemo.save();
    console.log("Demo info", newDemo)

    res.status(201).json({
      success: true,
      message: "Demo scheduled successfully",
      data: {
        id: newDemo._id,
        email: newDemo.email,
        date: newDemo.date,
        time: newDemo.time,
        status: newDemo.status,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked. Please select another time.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error scheduling demo",
      error: error.message,
    });
  }
};

// Get all demos (Admin endpoint)
const getAllDemos = async (req, res) => {
  try {
    const { status, date, email } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (date) filter.date = date;
    if (email) filter.email = email;

    const demos = await Demo.find(filter).sort({ fullDate: 1, time: 1 });

    res.json({
      success: true,
      count: demos.length,
      data: demos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching demos",
      error: error.message,
    });
  }
};

// Get single demo by ID
const getDemoById = async (req, res) => {
  try {
    const demo = await Demo.findById(req.params.id);

    if (!demo) {
      return res.status(404).json({
        success: false,
        message: "Demo not found",
      });
    }

    res.json({
      success: true,
      data: demo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching demo",
      error: error.message,
    });
  }
};

// Update demo status
const updateDemo = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const demo = await Demo.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!demo) {
      return res.status(404).json({
        success: false,
        message: "Demo not found",
      });
    }

    res.json({
      success: true,
      message: "Demo updated successfully",
      data: demo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating demo",
      error: error.message,
    });
  }
};

// Cancel demo
const cancelDemo = async (req, res) => {
  try {
    const demo = await Demo.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );

    if (!demo) {
      return res.status(404).json({
        success: false,
        message: "Demo not found",
      });
    }

    res.json({
      success: true,
      message: "Demo cancelled successfully",
      data: demo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling demo",
      error: error.message,
    });
  }
};

module.exports = {
  availableDates,
  availableTimeSlots,
  scheduleDemo,
  getAllDemos,
  getDemoById,
  updateDemo,
  cancelDemo,
};