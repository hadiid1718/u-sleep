import Demo from "../models/demo.model.js";

// Helper function to generate available dates (next 30 days, excluding weekends)
const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (let date = new Date(today); date <= maxDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            const fullDate = new Date(date);
            dates.push({
                fullDate: fullDate.toISOString().split('T')[0],
                day: fullDate.getDate(),
                month: fullDate.toLocaleString('en-US', { month: 'long' }),
                year: fullDate.getFullYear(),
                dayOfWeek: fullDate.toLocaleString('en-US', { weekday: 'short' })
            });
        }
    }

    return dates;
};

// Helper function to get booked slots for a specific date
const getBookedSlots = async (date) => {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const bookedDemos = await Demo.find({
            demoDate: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: { $ne: 'cancelled' }
        });

        return bookedDemos.map(demo => demo.timeSlot);
    } catch (error) {
        console.error("Error fetching booked slots:", error);
        return [];
    }
};

// Get available dates
export const getAvailableDates = async (req, res, next) => {
    try {
        const availableDates = generateAvailableDates();
        
        res.status(200).json({
            success: true,
            data: availableDates
        });
    } catch (error) {
        next(error);
    }
};

// Get available time slots for a specific date
export const getAvailableTimes = async (req, res, next) => {
    try {
        const { date } = req.params;

        // Validate date format
        if (!date || isNaN(new Date(date).getTime())) {
            const error = new Error("Invalid date format");
            error.statusCode = 400;
            throw error;
        }

        const defaultTimeSlots = [
            '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
            '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
        ];

        // Get booked slots for the selected date
        const bookedSlots = await getBookedSlots(date);

        // Create available/unavailable time slots
        const timeSlots = defaultTimeSlots.map(time => ({
            time,
            available: !bookedSlots.includes(time)
        }));

        res.status(200).json({
            success: true,
            data: timeSlots
        });
    } catch (error) {
        next(error);
    }
};

// Schedule a demo
export const scheduleDemo = async (req, res, next) => {
    try {
        const { email, name, company, phone, demoDate, timeSlot } = req.body;

        // Validate required fields
        if (!email || !demoDate || !timeSlot) {
            const error = new Error("Email, demo date, and time slot are required");
            error.statusCode = 400;
            throw error;
        }

        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            const error = new Error("Please enter a valid email address");
            error.statusCode = 400;
            throw error;
        }

        // Check if the time slot is already booked
        const startOfDay = new Date(demoDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(demoDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingDemo = await Demo.findOne({
            demoDate: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            timeSlot,
            status: { $ne: 'cancelled' }
        });

        if (existingDemo) {
            const error = new Error("This time slot is already booked. Please select another.");
            error.statusCode = 409;
            throw error;
        }

        // Check if user already has a demo scheduled for the same date and time
        const userExistingDemo = await Demo.findOne({
            email: email.toLowerCase(),
            demoDate: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: { $ne: 'cancelled' }
        });

        if (userExistingDemo) {
            const error = new Error("You already have a demo scheduled for this date. Please cancel the existing one or choose a different date.");
            error.statusCode = 409;
            throw error;
        }

        // Create new demo
        const newDemo = await Demo.create({
            email: email.toLowerCase(),
            name: name || null,
            company: company || null,
            phone: phone || null,
            demoDate: new Date(demoDate),
            timeSlot,
            status: 'scheduled'
        });

        res.status(201).json({
            success: true,
            message: "Demo scheduled successfully",
            data: {
                demoId: newDemo._id,
                email: newDemo.email,
                demoDate: newDemo.demoDate,
                timeSlot: newDemo.timeSlot,
                status: newDemo.status
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get all demos (admin)
export const getAllDemos = async (req, res, next) => {
    try {
        const demos = await Demo.find({})
            .sort({ demoDate: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: demos.length,
            data: demos
        });
    } catch (error) {
        next(error);
    }
};

// Get demo by ID
export const getDemoById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const demo = await Demo.findById(id);

        if (!demo) {
            const error = new Error("Demo not found");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            data: demo
        });
    } catch (error) {
        next(error);
    }
};

// Update demo status
export const updateDemoStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!status) {
            const error = new Error("Status is required");
            error.statusCode = 400;
            throw error;
        }

        const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
        if (!validStatuses.includes(status)) {
            const error = new Error("Invalid status");
            error.statusCode = 400;
            throw error;
        }

        const updatedDemo = await Demo.findByIdAndUpdate(
            id,
            { status, notes: notes || undefined },
            { new: true, runValidators: true }
        );

        if (!updatedDemo) {
            const error = new Error("Demo not found");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            message: "Demo status updated successfully",
            data: updatedDemo
        });
    } catch (error) {
        next(error);
    }
};

// Cancel demo
export const cancelDemo = async (req, res, next) => {
    try {
        const { id } = req.params;

        const demo = await Demo.findByIdAndUpdate(
            id,
            { status: 'cancelled' },
            { new: true }
        );

        if (!demo) {
            const error = new Error("Demo not found");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            message: "Demo cancelled successfully",
            data: demo
        });
    } catch (error) {
        next(error);
    }
};
