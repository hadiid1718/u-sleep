import SuspensionAppeal from '../models/suspensionAppeal.model.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { sendMail } from '../config/nodemailer.js';

/**
 * Submit a suspension appeal
 */
export const submitSuspensionAppeal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { appealMessage, phone, preferredContact } = req.body;

    // Validate input
    if (!appealMessage || appealMessage.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Appeal message must be at least 10 characters long',
      });
    }

    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number is required',
      });
    }

    // Check if user is suspended
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.accountStatus !== 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'Only suspended accounts can submit appeals',
      });
    }

    // Check if there's already a pending or under_review appeal
    const existingAppeal = await SuspensionAppeal.findOne({
      userId,
      currentStatus: { $in: ['pending', 'under_review'] },
    });

    if (existingAppeal) {
      return res.status(400).json({
        success: false,
        message:
          'You already have a pending appeal. Please wait for admin response.',
      });
    }

    // Create new appeal
    const appeal = await SuspensionAppeal.create({
      userId,
      userEmail: user.email,
      suspensionReason: user.statusReason || 'Account suspended',
      violationCount: user.violationCount,
      suspendedAt: user.statusUpdatedAt || new Date(),
      appealMessage,
      contactInfo: {
        phone,
        preferredContact,
      },
      appealsHistory: [
        {
          appealNumber: 1,
          message: appealMessage,
          submittedAt: new Date(),
          status: 'pending',
        },
      ],
    });

    // Send notification to user
    await Notification.create({
      userId,
      type: 'admin_case_update',
      group: 'account',
      title: '📋 Suspension Appeal Submitted',
      body: 'Your suspension appeal has been successfully submitted. Our admin team will review it shortly and get back to you.',
      platform: 'Admin',
      priority: 'high',
      icon: 'info',
      statusBadge: 'Appeal Submitted',
      cta: [],
      read: false,
      timestamp: new Date(),
    });

    // Send email confirmation to user
    await sendAppealConfirmationEmail(user.email, user.name);

    res.status(201).json({
      success: true,
      message: 'Appeal submitted successfully',
      appeal: {
        _id: appeal._id,
        status: appeal.currentStatus,
        submittedAt: appeal.submittedAt,
      },
    });
  } catch (error) {
    console.error('Error submitting appeal:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting appeal',
      error: error.message,
    });
  }
};

/**
 * Get user's appeals
 */
export const getUserAppeals = async (req, res) => {
  try {
    const userId = req.user._id;

    const appeals = await SuspensionAppeal.find({ userId }).sort({
      submittedAt: -1,
    });

    res.status(200).json({
      success: true,
      appeals,
    });
  } catch (error) {
    console.error('Error fetching appeals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appeals',
      error: error.message,
    });
  }
};

/**
 * Get single appeal details
 */
export const getAppealDetails = async (req, res) => {
  try {
    const { appealId } = req.params;
    const userId = req.user._id;

    const appeal = await SuspensionAppeal.findOne({
      _id: appealId,
      userId,
    });

    if (!appeal) {
      return res.status(404).json({
        success: false,
        message: 'Appeal not found',
      });
    }

    res.status(200).json({
      success: true,
      appeal,
    });
  } catch (error) {
    console.error('Error fetching appeal details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appeal details',
      error: error.message,
    });
  }
};

/**
 * Add a reply to an appeal (for user)
 */
export const addAppealReply = async (req, res) => {
  try {
    const { appealId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reply message must be at least 10 characters long',
      });
    }

    const appeal = await SuspensionAppeal.findOne({
      _id: appealId,
      userId,
    });

    if (!appeal) {
      return res.status(404).json({
        success: false,
        message: 'Appeal not found',
      });
    }

    if (
      appeal.currentStatus !== 'under_review' &&
      appeal.currentStatus !== 'pending'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot reply to this appeal. Appeal status: ' + appeal.currentStatus,
      });
    }

    // Add to appeals history
    appeal.appealsHistory.push({
      appealNumber: appeal.appealsHistory.length + 1,
      message,
      submittedAt: new Date(),
      status: 'pending',
    });

    appeal.updatedAt = new Date();
    await appeal.save();

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      appeal,
    });
  } catch (error) {
    console.error('Error adding appeal reply:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reply',
      error: error.message,
    });
  }
};

/**
 * [ADMIN] Get all appeals
 */
export const getAllAppeals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) {
      filter.currentStatus = status;
    }

    const skip = (page - 1) * limit;
    const appeals = await SuspensionAppeal.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await SuspensionAppeal.countDocuments(filter);

    res.status(200).json({
      success: true,
      appeals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching appeals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appeals',
      error: error.message,
    });
  }
};

/**
 * [ADMIN] Review and respond to appeal
 */
export const reviewAppeal = async (req, res) => {
  try {
    const { appealId } = req.params;
    const { decision, adminResponse, adminNotes } = req.body;
    const adminId = req.user._id || 'admin';

    // Validate input
    if (
      !['lift_suspension', 'maintain_suspension', 'permanent_block'].includes(
        decision
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid decision. Must be lift_suspension, maintain_suspension, or permanent_block',
      });
    }

    const appeal = await SuspensionAppeal.findById(appealId);
    if (!appeal) {
      return res.status(404).json({
        success: false,
        message: 'Appeal not found',
      });
    }

    // Update appeal
    appeal.currentStatus = 'accepted';
    appeal.adminReview = {
      reviewedBy: String(adminId),
      reviewedAt: new Date(),
      adminResponse: adminResponse || '',
      decision,
      adminNotes: adminNotes || '',
    };
    appeal.resolvedAt = new Date();

    await appeal.save();

    // Update user account status based on decision
    const user = await User.findById(appeal.userId);
    if (user) {
      if (decision === 'lift_suspension') {
        user.accountStatus = 'active';
        user.statusReason = '';
        user.statusUpdatedAt = new Date();
      } else if (decision === 'permanent_block') {
        user.accountStatus = 'blocked';
        user.statusReason =
          'Account permanently blocked - suspension appeal rejected';
        user.statusUpdatedAt = new Date();
      }
      // For maintain_suspension, keep current status

      await user.save();

      // Send decision notification to user
      await sendAppealDecisionNotification(user, decision, adminResponse);

      // Send decision email to user
      await sendAppealDecisionEmail(
        user.email,
        user.name,
        decision,
        adminResponse
      );
    }

    res.status(200).json({
      success: true,
      message: 'Appeal reviewed successfully',
      appeal,
      userStatusUpdated:
        decision === 'lift_suspension' || decision === 'permanent_block',
    });
  } catch (error) {
    console.error('Error reviewing appeal:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing appeal',
      error: error.message,
    });
  }
};

/**
 * Send appeal confirmation email
 */
const sendAppealConfirmationEmail = async (email, name) => {
  try {
    const emailBody = `
Dear ${name},

Thank you for submitting your suspension appeal. We have received your request and our admin team will review it within 24-48 hours.

You will receive an email notification once your appeal has been reviewed.

Best regards,
The Job Finder AI Team
    `;

    const htmlBody = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #1976d2;">📋 Appeal Submitted Successfully</h2>
  <p>Dear <strong>${name}</strong>,</p>
  <p>Thank you for submitting your suspension appeal. We have received your request and our admin team will review it shortly.</p>
  <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
    <h4>✅ What Happens Next?</h4>
    <ul>
      <li>Our admin team will review your appeal</li>
      <li>This typically takes 24-48 hours</li>
      <li>You'll receive an email with the decision</li>
      <li>You can check your appeal status anytime by signing in</li>
    </ul>
  </div>
  <p>If you have any questions, please reply to this email or contact our support team.</p>
  <br/>
  <p>Best regards,<br/><strong>The Job Finder AI Team</strong></p>
</div>
    `;

    await sendMail({
      to: email,
      subject: '📋 Your Suspension Appeal Has Been Received',
      text: emailBody,
      html: htmlBody,
    });
  } catch (error) {
    console.error('Error sending appeal confirmation email:', error);
  }
};

/**
 * Send appeal decision notification
 */
const sendAppealDecisionNotification = async (
  user,
  decision,
  adminResponse
) => {
  try {
    let notificationTitle, notificationBody, icon;

    if (decision === 'lift_suspension') {
      notificationTitle = '✅ Suspension Lifted';
      notificationBody =
        'Good news! Your suspension has been lifted. Your account is now active and you can resume normal activities.';
      icon = 'check_circle';
    } else if (decision === 'permanent_block') {
      notificationTitle = '❌ Account Blocked';
      notificationBody =
        'Your account has been permanently blocked following the review of your appeal.';
      icon = 'block';
    } else {
      notificationTitle = '⏳ Appeal Decision';
      notificationBody =
        'Your suspension appeal has been reviewed. Your account remains suspended.';
      icon = 'info';
    }

    await Notification.create({
      userId: user._id,
      type: 'admin_case_update',
      group: 'account',
      title: notificationTitle,
      body:
        notificationBody +
        (adminResponse ? `\n\nAdmin response: ${adminResponse}` : ''),
      platform: 'Admin',
      priority: 'high',
      icon,
      statusBadge: 'Appeal Resolved',
      cta: [],
      read: false,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error sending appeal decision notification:', error);
  }
};

/**
 * Send appeal decision email
 */
const sendAppealDecisionEmail = async (
  email,
  name,
  decision,
  adminResponse
) => {
  try {
    let subject, bodyHeading, bodyMessage, bgColor;

    if (decision === 'lift_suspension') {
      subject = '✅ Your Suspension Has Been Lifted';
      bodyHeading = 'Suspension Lifted';
      bodyMessage =
        'Good news! Your suspension appeal has been approved. Your account is now active and you can resume normal activities.';
      bgColor = '#e8f5e9';
    } else if (decision === 'permanent_block') {
      subject = '❌ Your Account Has Been Permanently Blocked';
      bodyHeading = 'Account Blocked';
      bodyMessage =
        'Unfortunately, your suspension appeal has been rejected and your account has been permanently blocked. This decision is final.';
      bgColor = '#ffebee';
    } else {
      subject = '⏳ Your Suspension Appeal Status';
      bodyHeading = 'Appeal Decision';
      bodyMessage =
        'Your suspension appeal has been reviewed. Your account remains suspended at this time.';
      bgColor = '#fff3e0';
    }

    const emailBody = `
Dear ${name},

${bodyMessage}

${adminResponse ? `Admin Response:\n${adminResponse}` : ''}

If you have any questions, please contact our support team.

Best regards,
The Job Finder AI Team
    `;

    const htmlBody = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #1976d2;">${bodyHeading}</h2>
  <p>Dear <strong>${name}</strong>,</p>
  <p>${bodyMessage}</p>
  ${
  adminResponse
    ? `<div style="background-color: ${bgColor}; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
    <h4>Admin Response:</h4>
    <p>${adminResponse}</p>
  </div>`
    : ''
}
  <p>If you have any questions or concerns, please contact our support team.</p>
  <br/>
  <p>Best regards,<br/><strong>The Job Finder AI Team</strong></p>
</div>
    `;

    await sendMail({
      to: email,
      subject,
      text: emailBody,
      html: htmlBody,
    });
  } catch (error) {
    console.error('Error sending appeal decision email:', error);
  }
};
