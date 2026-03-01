import { serve } from '@upstash/workflow/express';
import User from '../models/user.model.js';
import { sendMail } from '../config/nodemailer.js';

const REMINDER_DAYS = [7, 5, 3, 1];

/**
 * Generates the HTML email template for subscription expiry reminders.
 */
function buildReminderEmail(userName, daysLeft, plan) {
  return {
    subject: `⏰ Your U-Sleep subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`,
    text: `Hi ${userName}, your "${plan}" plan expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Renew now to keep uninterrupted access.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #1e293b;">Hi ${userName}</h2>
        <p style="font-size: 16px; color: #334155;">
          Your <strong>${plan}</strong> subscription is expiring in
          <strong style="color: #dc2626;">${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.
        </p>
        <p style="font-size: 14px; color: #64748b;">
          Renew now to continue enjoying all features without interruption.
        </p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/subscription"
           style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #2563eb; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Renew Subscription
        </a>
        <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
          — The U-Sleep Team
        </p>
      </div>
    `,
  };
}

/**
 * Upstash Workflow – Subscription Expiry Reminder
 *
 * Triggered when a user subscribes (or can be triggered manually).
 * Sends reminder emails at 7, 5, 3, and 1 day(s) before the subscription expires.
 *
 * Payload: { userId: string }
 */
export const subscriptionWorkflow = serve(
  async context => {
    const { userId } = context.requestPayload;

    // Step 1: Fetch user and subscription details
    const user = await context.run('fetch-user', async () => {
      const found = await User.findById(userId).lean();
      if (!found) throw new Error(`User ${userId} not found`);
      return {
        _id: found._id.toString(),
        name: found.name,
        email: found.email,
        plan: found.subscription?.plan,
        status: found.subscription?.status,
        expiresAt: found.subscription?.expiresAt?.toISOString() || null,
      };
    });

    // Guard: skip if no active subscription or no expiry date
    if (!user.expiresAt || user.status !== 'active') {
      console.log(
        `Workflow skipped – user ${userId} has no active subscription.`
      );
      return;
    }

    const expiresAt = new Date(user.expiresAt);

    // Step 2: Loop through reminder days [7, 5, 3, 1]
    for (const daysLeft of REMINDER_DAYS) {
      const sendAt = new Date(
        expiresAt.getTime() - daysLeft * 24 * 60 * 60 * 1000
      );

      // If the send date is already in the past, skip this reminder
      if (sendAt <= new Date()) {
        console.log(
          `Skipping ${daysLeft}-day reminder for ${user.email} – date already passed.`
        );
        continue;
      }

      // Sleep until it's time to send the reminder
      await context.sleepUntil(`sleep-until-${daysLeft}d-before`, sendAt);

      // Re-fetch user to check if still active (they may have renewed)
      const currentUser = await context.run(
        `check-status-${daysLeft}d`,
        async () => {
          const u = await User.findById(userId)
            .select('subscription email')
            .lean();
          return {
            email: u?.email,
            status: u?.subscription?.status,
            expiresAt: u?.subscription?.expiresAt?.toISOString() || null,
          };
        }
      );

      // If subscription is no longer active or has been renewed, stop the workflow
      if (currentUser.status !== 'active') {
        console.log(
          `Workflow stopped – user ${userId} subscription is no longer active.`
        );
        return;
      }

      // If expiresAt changed (renewed), stop this workflow — a new one should be triggered
      if (currentUser.expiresAt !== user.expiresAt) {
        console.log(
          `Workflow stopped – user ${userId} renewed their subscription.`
        );
        return;
      }

      // Send the reminder email
      await context.run(`send-email-${daysLeft}d`, async () => {
        const { subject, text, html } = buildReminderEmail(
          user.name,
          daysLeft,
          user.plan
        );

        await sendMail({
          to: user.email,
          subject,
          text,
          html,
        });

        console.log(` Sent ${daysLeft}-day reminder to ${user.email}`);
      });
    }

    console.log(`Workflow complete for user ${userId}.`);
  },
  {
    retries: 3,
  }
);
