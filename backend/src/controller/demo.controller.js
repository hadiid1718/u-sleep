import Demo from '../models/demo.model.js';
import { sendMail } from '../config/nodemailer.js';

// Helper function to generate available dates (next 30 days, excluding weekends)
const generateAvailableDates = () => {
  const dates = [];
  const today = new Date();
  const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  for (
    let date = new Date(today);
    date <= maxDate;
    date.setDate(date.getDate() + 1)
  ) {
    const dayOfWeek = date.getDay();

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const fullDate = new Date(date);
      dates.push({
        fullDate: fullDate.toISOString().split('T')[0],
        day: fullDate.getDate(),
        month: fullDate.toLocaleString('en-US', { month: 'long' }),
        year: fullDate.getFullYear(),
        dayOfWeek: fullDate.toLocaleString('en-US', { weekday: 'short' }),
      });
    }
  }

  return dates;
};

// Helper function to get booked slots for a specific date
const getBookedSlots = async date => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedDemos = await Demo.find({
      demoDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $ne: 'cancelled' },
    });

    return bookedDemos.map(demo => demo.timeSlot);
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    return [];
  }
};

const formatDemoDate = demoDate => {
  if (!demoDate) return 'N/A';

  const date = new Date(demoDate);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDemoDateKey = demoDate => {
  if (!demoDate) return null;

  const date = new Date(demoDate);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().split('T')[0];
};

const isSameDemoSlot = (leftDemo, rightDemo) => {
  return (
    getDemoDateKey(leftDemo?.demoDate) === getDemoDateKey(rightDemo?.demoDate) &&
    String(leftDemo?.timeSlot || '') === String(rightDemo?.timeSlot || '')
  );
};

const buildDemoMailContent = ({ demo, subject, message, meetUrl }) => {
  const demoDetails = [
    `Name: ${demo.name || 'N/A'}`,
    `Email: ${demo.email || 'N/A'}`,
    `Company: ${demo.company || 'N/A'}`,
    `Phone: ${demo.phone || 'N/A'}`,
    `Demo Date: ${formatDemoDate(demo.demoDate)}`,
    `Time Slot: ${demo.timeSlot || 'N/A'}`,
    `Status: ${demo.status || 'scheduled'}`,
  ].join('\n');

  const text = [
    message,
    '',
    `Google Meet URL: ${meetUrl}`,
    '',
    'Demo details:',
    demoDetails,
  ].join('\n');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.7;color:#0f172a;">
      <h2 style="margin:0 0 12px;color:#047857;">${subject}</h2>
      <p style="margin:0 0 16px;white-space:pre-wrap;">${message}</p>
      <p style="margin:0 0 16px;"><strong>Google Meet URL:</strong> <a href="${meetUrl}" target="_blank" rel="noreferrer">${meetUrl}</a></p>
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#f8fafc;">
        <h3 style="margin:0 0 10px;font-size:16px;">Demo details</h3>
        <ul style="margin:0;padding-left:18px;">
          <li><strong>Name:</strong> ${demo.name || 'N/A'}</li>
          <li><strong>Email:</strong> ${demo.email || 'N/A'}</li>
          <li><strong>Company:</strong> ${demo.company || 'N/A'}</li>
          <li><strong>Phone:</strong> ${demo.phone || 'N/A'}</li>
          <li><strong>Demo Date:</strong> ${formatDemoDate(demo.demoDate)}</li>
          <li><strong>Time Slot:</strong> ${demo.timeSlot || 'N/A'}</li>
          <li><strong>Status:</strong> ${demo.status || 'scheduled'}</li>
        </ul>
      </div>
    </div>`;

  return { text, html };
};

// Get available dates
export const getAvailableDates = async (req, res, next) => {
  try {
    const availableDates = generateAvailableDates();

    res.status(200).json({
      success: true,
      data: availableDates,
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
      const error = new Error('Invalid date format');
      error.statusCode = 400;
      throw error;
    }

    const defaultTimeSlots = [
      '09:00 AM',
      '10:00 AM',
      '11:00 AM',
      '12:00 PM',
      '01:00 PM',
      '02:00 PM',
      '03:00 PM',
      '04:00 PM',
      '05:00 PM',
    ];

    // Get booked slots for the selected date
    const bookedSlots = await getBookedSlots(date);

    // Create available/unavailable time slots
    const timeSlots = defaultTimeSlots.map(time => ({
      time,
      available: !bookedSlots.includes(time),
    }));

    res.status(200).json({
      success: true,
      data: timeSlots,
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
      const error = new Error('Email, demo date, and time slot are required');
      error.statusCode = 400;
      throw error;
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      const error = new Error('Please enter a valid email address');
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
        $lte: endOfDay,
      },
      timeSlot,
      status: { $ne: 'cancelled' },
    });

    if (existingDemo) {
      const error = new Error(
        'This time slot is already booked. Please select another.'
      );
      error.statusCode = 409;
      throw error;
    }

    // Check if user already has a demo scheduled for the same date and time
    const userExistingDemo = await Demo.findOne({
      email: email.toLowerCase(),
      demoDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $ne: 'cancelled' },
    });

    if (userExistingDemo) {
      const error = new Error(
        'You already have a demo scheduled for this date. Please cancel the existing one or choose a different date.'
      );
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
      status: 'scheduled',
    });

    res.status(201).json({
      success: true,
      message: 'Demo scheduled successfully',
      data: {
        demoId: newDemo._id,
        email: newDemo.email,
        demoDate: newDemo.demoDate,
        timeSlot: newDemo.timeSlot,
        status: newDemo.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all demos (admin) with pagination, filtering
export const getAllDemos = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.email)
      filter.email = { $regex: req.query.email, $options: 'i' };
    if (req.query.date) {
      const startOfDay = new Date(req.query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(req.query.date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.demoDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const [demos, totalCount] = await Promise.all([
      Demo.find(filter).sort({ demoDate: -1 }).skip(skip).limit(limit).lean(),
      Demo.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      count: demos.length,
      totalCount,
      page,
      totalPages,
      limit,
      data: demos,
    });
  } catch (error) {
    next(error);
  }
};

// Send demo details email to the user
export const sendDemoMail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, message, meetUrl } = req.body;

    if (!subject || !message || !meetUrl) {
      const error = new Error('Subject, message, and Google Meet URL are required');
      error.statusCode = 400;
      throw error;
    }

    let parsedMeetUrl;
    try {
      parsedMeetUrl = new URL(String(meetUrl).trim());
    } catch {
      const error = new Error('Please provide a valid Google Meet URL');
      error.statusCode = 400;
      throw error;
    }

    const normalizedMeetUrl = parsedMeetUrl.toString();
    const demo = await Demo.findById(id);

    if (!demo) {
      const error = new Error('Demo not found');
      error.statusCode = 404;
      throw error;
    }

    const emailSubject = String(subject).trim();
    const emailMessage = String(message).trim();

    const existingMeetUrlUsage = await Demo.find({
      meetUrl: normalizedMeetUrl,
      _id: { $ne: demo._id },
    }).select('demoDate timeSlot email meetUrl');

    const hasConflictingUsage = existingMeetUrlUsage.some(
      otherDemo => !isSameDemoSlot(otherDemo, demo)
    );

    if (hasConflictingUsage) {
      const conflictDemo = existingMeetUrlUsage.find(
        otherDemo => !isSameDemoSlot(otherDemo, demo)
      );
      const error = new Error(
        `This Google Meet URL is already used for another demo on ${formatDemoDate(conflictDemo?.demoDate)} at ${conflictDemo?.timeSlot || 'N/A'}. Use the same date and time slot or generate a different Meet link.`
      );
      error.statusCode = 409;
      throw error;
    }

    demo.meetUrl = normalizedMeetUrl;
    demo.meetUrlSentAt = new Date();
    await demo.save();

    const { text, html } = buildDemoMailContent({
      demo,
      subject: emailSubject,
      message: emailMessage,
      meetUrl: normalizedMeetUrl,
    });

    await sendMail({
      to: demo.email,
      subject: emailSubject,
      text,
      html,
    });

    res.status(200).json({
      success: true,
      message: 'Demo mail sent successfully',
      data: {
        demoId: demo._id,
        email: demo.email,
        subject: emailSubject,
        meetUrl: normalizedMeetUrl,
        sentAt: new Date(),
      },
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
      const error = new Error('Demo not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: demo,
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
      const error = new Error('Status is required');
      error.statusCode = 400;
      throw error;
    }

    const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      const error = new Error('Invalid status');
      error.statusCode = 400;
      throw error;
    }

    const updatedDemo = await Demo.findByIdAndUpdate(
      id,
      { status, notes: notes || undefined },
      { new: true, runValidators: true }
    );

    if (!updatedDemo) {
      const error = new Error('Demo not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Demo status updated successfully',
      data: updatedDemo,
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
      const error = new Error('Demo not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Demo cancelled successfully',
      data: demo,
    });
  } catch (error) {
    next(error);
  }
};
