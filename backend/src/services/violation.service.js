import User from '../models/user.model.js';
import ViolationHistory from '../models/violationHistory.model.js';
import TermsAndConditions from '../models/termsAndConditions.model.js';
import AdminSetting from '../models/adminSetting.model.js';
import Notification from '../models/notification.model.js';
import { sendMail } from '../config/nodemailer.js';

/**
 * Log a violation and determine action (warning or suspension)
 */
export const logViolation = async (
  userId,
  ruleId,
  description,
  evidence = ''
) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const settings = await AdminSetting.findOne().lean();
    const termsAndConditions = await TermsAndConditions.findOne({
      isActive: true,
    }).lean();

    if (!termsAndConditions) {
      throw new Error('Terms and Conditions not configured');
    }

    // Find the rule
    const rule = termsAndConditions.violationRules.find(
      r => r.ruleId === ruleId
    );
    if (!rule) {
      throw new Error('Violation rule not found');
    }

    // Increment violation count
    user.violationCount += 1;
    const violationNumber = user.violationCount;

    // Create violation history record
    let actionTaken = 'warning_sent';
    const warningsSent = { inApp: false, email: false };

    // Check if this is the suspension threshold
    if (violationNumber >= (settings?.violationLimit || 3)) {
      actionTaken = 'account_suspended';
      user.accountStatus = 'suspended';
      user.statusReason = `Account suspended due to violation: ${rule.ruleName}`;
      user.statusUpdatedAt = new Date();
    }

    // Create violation history
    const violationRecord = await ViolationHistory.create({
      userId: user._id,
      ruleId,
      ruleName: rule.ruleName,
      description,
      severity: rule.severity,
      violationNumber,
      actionTaken,
      evidence,
      reportedBy: 'system',
    });

    // Send notifications and warnings if not yet suspended
    if (actionTaken === 'warning_sent') {
      // Send in-app notification
      const warningMessage = `Warning ${violationNumber}: You have violated our Terms and Conditions (${rule.ruleName}). This is warning ${violationNumber} of ${settings?.violationLimit || 3}. Further violations may result in account suspension.`;

      await createWarningNotification(
        user._id,
        rule.ruleName,
        warningMessage,
        violationNumber
      );
      warningsSent.inApp = true;

      // Send email notification
      await sendViolationWarningEmail(
        user.email,
        user.name,
        rule.ruleName,
        warningMessage,
        violationNumber,
        settings?.violationLimit || 3
      );
      warningsSent.email = true;

      // Update warning status in violation record
      violationRecord.warningsSent = warningsSent;
      violationRecord.warningsSent.warningMessage = warningMessage;
      await violationRecord.save();
    } else if (actionTaken === 'account_suspended') {
      // Send suspension notification (no warning)
      const suspensionMessage = `Your account has been suspended due to violation: ${rule.ruleName}. You have reached the maximum number of violations (${violationNumber}). Please contact support for more information.`;

      await createSuspensionNotification(
        user._id,
        rule.ruleName,
        suspensionMessage
      );

      // Send suspension email
      await sendAccountSuspensionEmail(
        user.email,
        user.name,
        rule.ruleName,
        suspensionMessage
      );
    }

    // Save user
    await user.save();

    return {
      success: true,
      violationNumber,
      actionTaken,
      userStatus: user.accountStatus,
      notification: {
        type: actionTaken === 'warning_sent' ? 'warning' : 'suspension',
        warningsSent,
      },
    };
  } catch (error) {
    console.error('Error logging violation:', error);
    throw error;
  }
};

/**
 * Create in-app warning notification
 */
const createWarningNotification = async (
  userId,
  ruleName,
  message,
  violationNumber
) => {
  try {
    const _remainingWarnings = 3 - violationNumber;
    return await Notification.create({
      userId,
      type: 'admin_case_update',
      group: 'account',
      title: `⚠️ Violation Warning - ${violationNumber} of 3`,
      body: message,
      platform: 'Admin',
      priority: 'high',
      icon: 'warning',
      statusBadge: `Warning ${violationNumber}`,
      cta: [
        {
          label: 'View Terms',
          action: '/terms-and-conditions',
        },
      ],
      read: false,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating warning notification:', error);
  }
};

/**
 * Create suspension notification
 */
const createSuspensionNotification = async (userId, ruleName, message) => {
  try {
    return await Notification.create({
      userId,
      type: 'admin_case_update',
      group: 'account',
      title: '🚫 Account Suspended',
      body: message,
      platform: 'Admin',
      priority: 'high',
      icon: 'error',
      statusBadge: 'Account Suspended',
      cta: [
        {
          label: 'Appeal Suspension',
          action: '/suspension-appeal',
        },
      ],
      read: false,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating suspension notification:', error);
  }
};

/**
 * Send violation warning email
 */
const sendViolationWarningEmail = async (
  email,
  name,
  ruleName,
  message,
  violationNumber,
  maxViolations
) => {
  try {
    const emailBody = `
Dear ${name},

This is warning ${violationNumber} of ${maxViolations} regarding a violation of our Terms and Conditions.

Violation: ${ruleName}

${message}

If you believe this is a mistake, please contact our support team immediately.

Best regards,
The Job Finder AI Team
    `;

    const htmlBody = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #d32f2f;">⚠️ Account Warning - Violation Detected</h2>
  <p>Dear <strong>${name}</strong>,</p>
  <p>This is <strong>warning ${violationNumber} of ${maxViolations}</strong> regarding a violation of our Terms and Conditions.</p>
  <h3 style="color: #d32f2f;">Violation: ${ruleName}</h3>
  <p>${message}</p>
  <p style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107;">
    <strong>Important:</strong> If you receive one more violation, your account will be automatically suspended.
  </p>
  <p>If you believe this is a mistake or would like to appeal, please <a href="${process.env.FRONTEND_URL}/suspension-appeal" style="color: #1976d2;">contact our support team</a>.</p>
  <br/>
  <p>Best regards,<br/><strong>The Job Finder AI Team</strong></p>
</div>
    `;

    await sendMail({
      to: email,
      subject: `⚠️ Warning: Account Violation (${violationNumber}/${maxViolations})`,
      text: emailBody,
      html: htmlBody,
    });
  } catch (error) {
    console.error('Error sending violation warning email:', error);
  }
};

/**
 * Send account suspension email
 */
const sendAccountSuspensionEmail = async (email, name, ruleName, message) => {
  try {
    const emailBody = `
Dear ${name},

Your account has been suspended due to multiple violations of our Terms and Conditions.

Violation: ${ruleName}

${message}

You can appeal this suspension by visiting our appeal form. To appeal, sign in with your account and navigate to the suspension appeal page.

Best regards,
The Job Finder AI Team
    `;

    const htmlBody = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #d32f2f;">🚫 Account Suspended</h2>
  <p>Dear <strong>${name}</strong>,</p>
  <p>Your account has been <strong>suspended</strong> due to multiple violations of our Terms and Conditions.</p>
  <h3 style="color: #d32f2f;">Violation: ${ruleName}</h3>
  <p>${message}</p>
  <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
    <h4>📋 What Happens Next?</h4>
    <ul>
      <li>Your account is temporarily suspended</li>
      <li>You can still sign in, but have restricted access</li>
      <li>You can submit an appeal to our admin team</li>
      <li>An admin will review and respond to your appeal</li>
    </ul>
  </div>
  <p>To appeal this suspension, <a href="${process.env.FRONTEND_URL}/suspension-appeal" style="color: #1976d2; font-weight: bold;">click here to submit an appeal</a>.</p>
  <br/>
  <p>Best regards,<br/><strong>The Job Finder AI Team</strong></p>
</div>
    `;

    await sendMail({
      to: email,
      subject: '🚫 Your Account Has Been Suspended',
      text: emailBody,
      html: htmlBody,
    });
  } catch (error) {
    console.error('Error sending suspension email:', error);
  }
};

/**
 * Get violation history for a user
 */
export const getUserViolationHistory = async userId => {
  try {
    return await ViolationHistory.find({ userId }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error fetching violation history:', error);
    throw error;
  }
};

/**
 * Get active terms and conditions
 */
export const getActiveTerms = async () => {
  try {
    return await TermsAndConditions.findOne({ isActive: true });
  } catch (error) {
    console.error('Error fetching active terms:', error);
    throw error;
  }
};

/**
 * Check if user has accepted latest terms
 */
export const hasUserAcceptedLatestTerms = async userId => {
  try {
    const user = await User.findById(userId);
    const activeTerms = await TermsAndConditions.findOne({ isActive: true });

    if (!activeTerms) {
      return true; // If no terms exist, consider it accepted
    }

    return user.termsAccepted && user.termsVersion === activeTerms.version;
  } catch (error) {
    console.error('Error checking terms acceptance:', error);
    throw error;
  }
};

/**
 * Mark terms as accepted for user
 */
export const acceptTermsForUser = async userId => {
  try {
    const activeTerms = await TermsAndConditions.findOne({ isActive: true });

    if (!activeTerms) {
      throw new Error('No active terms and conditions found');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        termsAccepted: true,
        termsVersion: activeTerms.version,
        termsAcceptedAt: new Date(),
      },
      { new: true }
    );

    return user;
  } catch (error) {
    console.error('Error accepting terms:', error);
    throw error;
  }
};
