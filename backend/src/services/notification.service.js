import Notification from '../models/notification.model.js';
import Proposal from '../models/proposal.model.js';
import Job from '../models/job.model.js';
import Subscription from '../models/subscription.model.js';
import UsageRecord from '../models/usageRecord.model.js';
import User from '../models/user.model.js';
import { sendMail } from '../config/nodemailer.js';
import { FRONTEND_URL } from '../config/env.js';
import {
  getPlanConfig,
  getPlanRank,
  isUnlimitedPlan,
  toMonthKey,
} from '../utils/subscriptionPlans.js';

const FRONTEND_BASE_URL = (FRONTEND_URL || 'http://localhost:5173').replace(
  /\/$/,
  ''
);
const BILLING_SETTINGS_URL = `${FRONTEND_BASE_URL}/billing`;

const GROUP_BY_TYPE = {
  job_alert: 'new_jobs',
  proposal_sent: 'proposals',
  proposal_pending: 'proposals',
  proposal_rejected: 'proposals',
  billing_renewal: 'billing',
  billing_success: 'billing',
  billing_failed: 'billing',
  billing_plan_change: 'billing',
  billing_trial_expiry: 'billing',
  billing_usage_limit: 'billing',
};

const ICON_BY_GROUP = {
  new_jobs: 'briefcase',
  proposals: 'file-text',
  billing: 'credit-card',
};

const toIsoDate = value => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const formatMoney = (amount, currency = 'USD') => {
  if (!Number.isFinite(Number(amount))) return null;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${Number(amount).toFixed(2)} ${currency}`;
  }
};

const formatShortDate = value => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const platformLabel = platform => {
  const normalized = String(platform || '')
    .trim()
    .toLowerCase();
  if (!normalized) return 'N/A';
  if (normalized.includes('upwork')) return 'Upwork';
  if (normalized.includes('fiverr')) return 'Fiverr';
  if (normalized.includes('freelancer')) return 'Freelancer';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const trimText = (value, maxLength = 120) => {
  const clean = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trim()}...`;
};

const elapsedLabel = value => {
  if (!value) return 'just now';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 48) return `${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const getPriorityForType = (type, context = {}) => {
  switch (type) {
    case 'job_alert': {
      const score = Number(context.matchScore || 0);
      if (score >= 90) return 'high';
      if (score >= 70) return 'medium';
      return 'low';
    }
    case 'proposal_pending':
      return 'medium';
    case 'proposal_rejected':
      return 'low';
    case 'proposal_sent':
      return 'medium';
    case 'billing_failed':
      return 'high';
    case 'billing_renewal':
      return 'medium';
    case 'billing_success':
      return 'low';
    case 'billing_plan_change':
      return 'low';
    case 'billing_trial_expiry': {
      const daysLeft = Number(context.daysLeft);
      return daysLeft <= 0 ? 'high' : 'medium';
    }
    case 'billing_usage_limit': {
      const percentUsed = Number(context.percentUsed || 0);
      return percentUsed >= 100 ? 'high' : 'medium';
    }
    default:
      return 'low';
  }
};

const buildEmailSubject = (payload, context = {}) => {
  if (payload.type === 'job_alert') {
    return `[${payload.platform}] New Match Found`;
  }

  if (
    payload.type === 'proposal_sent' ||
    payload.type === 'proposal_pending' ||
    payload.type === 'proposal_rejected'
  ) {
    return `Proposal Update: ${context.jobTitle || 'Job Proposal'}`;
  }

  if (payload.type.startsWith('billing_')) {
    if (payload.type === 'billing_failed') {
      return 'Billing: Action Required';
    }

    if (payload.type === 'billing_success') {
      return 'Billing: Payment Confirmed';
    }

    return 'Billing: Plan Updated';
  }

  return payload.title;
};

const buildEmailHtml = ({ userName, payload }) => {
  const ctaHtml = (payload.cta || [])
    .slice(0, 3)
    .map(
      item =>
        `<a href="${item.action}" style="display:inline-block;padding:10px 16px;margin:8px 8px 0 0;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">${item.label}</a>`
    )
    .join('');

  const billingFootnote = payload.type.startsWith('billing_')
    ? `<p style="margin-top:16px;color:#334155;font-size:13px;">Manage billing details: <a href="${BILLING_SETTINGS_URL}">${BILLING_SETTINGS_URL}</a></p>`
    : '';

  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
      <p style="font-size:14px;color:#334155;margin:0 0 10px 0;">Hi ${trimText(userName || 'there', 40)},</p>
      <h2 style="font-size:20px;color:#0f172a;margin:0 0 10px 0;">${payload.title}</h2>
      <p style="font-size:14px;color:#334155;line-height:1.5;margin:0;">${payload.body}</p>
      <div style="margin-top:14px;">${ctaHtml}</div>
      ${billingFootnote}
    </div>
  `;
};

const buildEmailText = ({ userName, payload }) => {
  const ctaText = (payload.cta || [])
    .slice(0, 3)
    .map(item => `${item.label}: ${item.action}`)
    .join('\n');

  const billingLine = payload.type.startsWith('billing_')
    ? `\nManage billing settings: ${BILLING_SETTINGS_URL}`
    : '';

  return `Hi ${userName || 'there'},\n\n${payload.title}\n${payload.body}\n\n${ctaText}${billingLine}`;
};

const buildDeliveryPolicy = (
  payload,
  context,
  emailFrequency,
  options = {}
) => {
  const rawFrequency = String(emailFrequency || 'instant').toLowerCase();
  const forceDigestForNonHigh =
    rawFrequency === 'instant' &&
    options.instantHighPriorityOnly === true &&
    payload.priority !== 'high';
  const frequency = forceDigestForNonHigh ? 'daily' : rawFrequency;
  const policy = {
    sendInApp: true,
    sendEmailNow: false,
    queueDigest: false,
    digestWindow: frequency === 'weekly' ? 'weekly' : 'daily',
  };

  if (payload.type === 'billing_failed') {
    return { ...policy, sendInApp: true, sendEmailNow: true };
  }

  if (payload.type === 'billing_success') {
    return { ...policy, sendInApp: false, sendEmailNow: true };
  }

  if (payload.type === 'billing_renewal') {
    const days = Number(context.daysUntilRenewal);
    if (days === 7) {
      return { ...policy, sendInApp: false, sendEmailNow: true };
    }

    return {
      ...policy,
      sendInApp: true,
      sendEmailNow: false,
      queueDigest: false,
    };
  }

  if (payload.type === 'billing_trial_expiry') {
    const days = Number(context.daysLeft);
    if (days <= 0) {
      return { ...policy, sendInApp: true, sendEmailNow: true };
    }

    return { ...policy, sendInApp: true, queueDigest: true };
  }

  if (payload.type === 'billing_usage_limit') {
    const percent = Number(context.percentUsed || 0);
    if (percent >= 100) {
      return { ...policy, sendInApp: true, sendEmailNow: true };
    }

    return { ...policy, sendInApp: true, queueDigest: true };
  }

  if (payload.type === 'job_alert') {
    if (payload.priority === 'high') {
      return { ...policy, sendInApp: true, sendEmailNow: true };
    }

    if (payload.priority === 'medium') {
      if (frequency === 'instant') {
        return { ...policy, sendInApp: true, sendEmailNow: true };
      }
      return { ...policy, sendInApp: true, queueDigest: true };
    }

    return { ...policy, sendInApp: true };
  }

  if (payload.type === 'proposal_pending' || payload.type === 'proposal_sent') {
    if (frequency === 'instant') {
      return { ...policy, sendInApp: true, sendEmailNow: true };
    }

    return { ...policy, sendInApp: true, queueDigest: true };
  }

  return policy;
};

const toClientPayload = notification => ({
  id: String(notification._id),
  type: notification.type,
  title: notification.title,
  body: notification.body,
  platform: notification.platform,
  timestamp: toIsoDate(notification.timestamp || notification.createdAt),
  priority: notification.priority,
  icon: notification.icon,
  statusBadge: notification.statusBadge,
  cta: (notification.cta || []).map(item => ({
    label: item.label,
    action: item.action,
  })),
  read: Boolean(notification.read),
  group: notification.group,
  billing_meta: notification.billingMeta
    ? {
      plan: notification.billingMeta.plan || null,
      amount: notification.billingMeta.amount,
      currency: notification.billingMeta.currency || 'USD',
      due_date: toIsoDate(notification.billingMeta.dueDate),
      invoice_url: notification.billingMeta.invoiceUrl || null,
    }
    : null,
});

const sendSingleEmail = async ({ user, payload, context }) => {
  const subject = buildEmailSubject(payload, context);
  const html = buildEmailHtml({ userName: user.name, payload });
  const text = buildEmailText({ userName: user.name, payload });

  await sendMail({
    to: user.email,
    subject,
    text,
    html,
  });
};

const ensureBillingSettingsCta = payload => {
  if (!payload.type.startsWith('billing_')) return payload;

  const hasBillingCta = (payload.cta || []).some(
    item => String(item.action || '').trim() === BILLING_SETTINGS_URL
  );

  if (hasBillingCta) return payload;

  return {
    ...payload,
    cta: [
      ...(payload.cta || []),
      {
        label: 'Billing Settings',
        action: BILLING_SETTINGS_URL,
      },
    ],
  };
};

const createNotificationDoc = async ({
  user,
  payload,
  policy,
  context: _context,
  eventKey,
}) => {
  if (!policy.sendInApp) {
    return null;
  }

  const documentInput = {
    userId: user._id,
    type: payload.type,
    group: payload.group,
    title: payload.title,
    body: payload.body,
    platform: payload.platform,
    timestamp: payload.timestamp || new Date(),
    priority: payload.priority,
    icon: payload.icon,
    statusBadge: payload.statusBadge || null,
    cta: payload.cta || [],
    read: false,
    billingMeta: payload.billingMeta || null,
    eventKey,
    emailMeta: {
      forced: policy.sendEmailNow,
      digestStatus: policy.queueDigest ? 'pending' : 'none',
      digestWindow: policy.queueDigest ? policy.digestWindow : null,
    },
  };

  try {
    return await Notification.create(documentInput);
  } catch (error) {
    if (error?.code === 11000 && eventKey) {
      return Notification.findOne({ userId: user._id, eventKey });
    }
    throw error;
  }
};

const createPayload = ({ type, context = {} }) => {
  const platform = platformLabel(context.platform);
  const priority = getPriorityForType(type, context);
  const group = GROUP_BY_TYPE[type] || 'billing';
  const icon = ICON_BY_GROUP[group] || 'bell';

  if (type === 'job_alert') {
    const score = Math.max(0, Math.round(Number(context.matchScore || 0)));
    const budgetLabel =
      trimText(
        context.budgetLabel || context.rateLabel || 'Budget not listed',
        80
      ) || 'Budget not listed';
    const snippet = trimText(context.snippet || context.description || '', 140);

    return {
      type,
      group,
      platform,
      priority,
      icon,
      statusBadge: `${score}% Match`,
      title: `New ${score}% Match on ${platform} - ${trimText(context.jobTitle || 'New Opportunity', 72)}`,
      body: `${budgetLabel} | ${snippet || 'A matching job just opened. Apply before it fills.'}`,
      cta: [
        {
          label: 'View Job',
          action:
            context.viewJobUrl ||
            context.jobUrl ||
            `${FRONTEND_BASE_URL}/dashboard`,
        },
        {
          label: 'Generate Proposal',
          action:
            context.generateProposalUrl || `${FRONTEND_BASE_URL}/dashboard`,
        },
      ],
      timestamp: context.timestamp || new Date(),
      billingMeta: null,
    };
  }

  if (type === 'proposal_sent') {
    return {
      type,
      group,
      platform,
      priority,
      icon,
      statusBadge: 'Sent',
      title: `Proposal sent - ${trimText(context.jobTitle || 'Job', 84)}`,
      body: `${platform} | ${elapsedLabel(context.sentAt || context.timestamp)}. Track performance from your proposal dashboard.`,
      cta: [
        {
          label: 'View Proposal',
          action: context.proposalUrl || `${FRONTEND_BASE_URL}/dashboard`,
        },
      ],
      timestamp: context.timestamp || new Date(),
      billingMeta: null,
    };
  }

  if (type === 'proposal_pending') {
    return {
      type,
      group,
      platform,
      priority,
      icon,
      statusBadge: 'Pending',
      title: `Proposal still pending - ${trimText(context.jobTitle || 'Job', 84)}`,
      body: `Sent ${elapsedLabel(context.sentAt)}. A follow-up message could improve response odds.`,
      cta: [
        {
          label: 'View Proposal',
          action: context.proposalUrl || `${FRONTEND_BASE_URL}/dashboard`,
        },
      ],
      timestamp: context.timestamp || new Date(),
      billingMeta: null,
    };
  }

  if (type === 'proposal_rejected') {
    return {
      type,
      group,
      platform,
      priority,
      icon,
      statusBadge: 'Closed',
      title: `Proposal not selected - ${trimText(context.jobTitle || 'Job', 84)}`,
      body: trimText(
        `${platform} ${context.reason ? `| ${context.reason}. ` : '| '}Retarget quickly to similar open roles.`,
        170
      ),
      cta: [
        {
          label: 'Find Similar Jobs',
          action: context.similarJobsUrl || `${FRONTEND_BASE_URL}/dashboard`,
        },
      ],
      timestamp: context.timestamp || new Date(),
      billingMeta: null,
    };
  }

  if (type === 'billing_renewal') {
    const amountLabel =
      formatMoney(context.amount, context.currency) || 'Amount pending';
    const dueDate = formatShortDate(context.dueDate) || 'upcoming date';

    return {
      type,
      group,
      platform: 'N/A',
      priority,
      icon,
      statusBadge: 'Renewal',
      title: `Your ${context.plan || 'Plan'} renews soon`,
      body: `${amountLabel} renews on ${dueDate}${
        context.paymentMethod ? ` via ${context.paymentMethod}` : ''
      }.`,
      cta: [
        {
          label: 'Review Billing',
          action: BILLING_SETTINGS_URL,
        },
      ],
      timestamp: context.timestamp || new Date(),
      billingMeta: {
        plan: context.plan || null,
        amount: Number(context.amount || 0),
        currency: context.currency || 'USD',
        dueDate: context.dueDate || null,
        invoiceUrl: context.invoiceUrl || null,
      },
    };
  }

  if (type === 'billing_success') {
    const amountLabel =
      formatMoney(context.amount, context.currency) || 'Payment';

    return {
      type,
      group,
      platform: 'N/A',
      priority,
      icon,
      statusBadge: 'Paid',
      title: `Payment confirmed for ${context.plan || 'your plan'}`,
      body: `${amountLabel} processed for ${context.billingPeriod || 'this billing cycle'}.`,
      cta: [
        {
          label: context.invoiceUrl ? 'Download Invoice' : 'View Billing',
          action: context.invoiceUrl || BILLING_SETTINGS_URL,
        },
      ],
      timestamp: context.timestamp || new Date(),
      billingMeta: {
        plan: context.plan || null,
        amount: Number(context.amount || 0),
        currency: context.currency || 'USD',
        dueDate: context.dueDate || null,
        invoiceUrl: context.invoiceUrl || null,
      },
    };
  }

  if (type === 'billing_failed') {
    const amountLabel =
      formatMoney(context.amount, context.currency) || 'Payment';

    return {
      type,
      group,
      platform: 'N/A',
      priority,
      icon,
      statusBadge: 'Action Required',
      title: `Payment failed for ${context.plan || 'your plan'}`,
      body: `${amountLabel} could not be processed${
        context.reason ? ` (${trimText(context.reason, 80)})` : ''
      }. Update payment to avoid interruption.`,
      cta: [
        {
          label: 'Update Payment',
          action: BILLING_SETTINGS_URL,
        },
      ],
      timestamp: context.timestamp || new Date(),
      billingMeta: {
        plan: context.plan || null,
        amount: Number(context.amount || 0),
        currency: context.currency || 'USD',
        dueDate: context.dueDate || null,
        invoiceUrl: context.invoiceUrl || null,
      },
    };
  }

  if (type === 'billing_plan_change') {
    const oldPlan = context.oldPlan || 'Current Plan';
    const newPlan = context.newPlan || 'Updated Plan';
    const isUpgrade =
      Number(getPlanRank(context.newPlan)) >
      Number(getPlanRank(context.oldPlan));

    return {
      type,
      group,
      platform: 'N/A',
      priority,
      icon,
      statusBadge: isUpgrade ? 'Upgraded' : 'Updated',
      title: isUpgrade
        ? `Upgraded to ${newPlan}`
        : `Plan changed to ${newPlan}`,
      body: `${oldPlan} -> ${newPlan}${
        context.effectiveDate
          ? ` | Effective ${formatShortDate(context.effectiveDate)}`
          : ''
      }${
        Number.isFinite(Number(context.proratedAmount))
          ? ` | Prorated ${formatMoney(context.proratedAmount, context.currency)}`
          : ''
      }`,
      cta: [
        {
          label: 'View Billing',
          action: BILLING_SETTINGS_URL,
        },
      ],
      timestamp: context.timestamp || new Date(),
      billingMeta: {
        plan: newPlan,
        amount: Number(context.proratedAmount || 0),
        currency: context.currency || 'USD',
        dueDate: context.effectiveDate || null,
        invoiceUrl: context.invoiceUrl || null,
      },
    };
  }

  if (type === 'billing_trial_expiry') {
    const daysLeft = Number(context.daysLeft || 0);
    const title =
      daysLeft <= 0
        ? 'Your trial ends today'
        : `Your trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;

    return {
      type,
      group,
      platform: 'N/A',
      priority,
      icon,
      statusBadge: daysLeft <= 0 ? 'Today' : 'Trial',
      title,
      body: `Trial end date: ${formatShortDate(context.dueDate) || 'soon'}. Add payment to keep access uninterrupted.`,
      cta: [
        {
          label: 'Add Payment Method',
          action: BILLING_SETTINGS_URL,
        },
      ],
      timestamp: context.timestamp || new Date(),
      billingMeta: {
        plan: context.plan || 'Free Trial',
        amount: Number(context.amount || 0),
        currency: context.currency || 'USD',
        dueDate: context.dueDate || null,
        invoiceUrl: null,
      },
    };
  }

  if (type === 'billing_usage_limit') {
    const used = Number(context.used || 0);
    const limit = Number(context.limit || 0);
    const percent = Number(context.percentUsed || 0);

    return {
      type,
      group,
      platform: 'N/A',
      priority,
      icon,
      statusBadge: `${Math.min(100, Math.round(percent))}% Used`,
      title: `${Math.round(percent)}% of ${context.featureName || 'monthly quota'} used`,
      body: `${used}/${limit} consumed this month${
        percent >= 100
          ? '. Upgrade now to continue without limits.'
          : '. Stay ahead by upgrading if needed.'
      }`,
      cta: [
        {
          label: percent >= 100 ? 'Upgrade Plan' : 'Review Plan',
          action: BILLING_SETTINGS_URL,
        },
      ],
      timestamp: context.timestamp || new Date(),
      billingMeta: {
        plan: context.plan || null,
        amount: Number(context.amount || 0),
        currency: context.currency || 'USD',
        dueDate: context.dueDate || null,
        invoiceUrl: null,
      },
    };
  }

  throw new Error(`Unsupported notification type: ${type}`);
};

class NotificationService {
  async dispatch({ userId, type, context = {}, eventKey = null, user = null }) {
    const targetUser =
      user ||
      (await User.findById(userId)
        .select('name email notificationPreferences')
        .lean());

    if (!targetUser) return null;

    const payload = ensureBillingSettingsCta(createPayload({ type, context }));
    const emailFrequency =
      targetUser.notificationPreferences?.emailFrequency || 'instant';
    const inAppEnabled =
      targetUser.notificationPreferences?.inAppEnabled !== false;
    const emailEnabled =
      targetUser.notificationPreferences?.emailEnabled !== false;
    const instantHighPriorityOnly =
      targetUser.notificationPreferences?.instantHighPriorityOnly === true;

    const policy = buildDeliveryPolicy(payload, context, emailFrequency, {
      instantHighPriorityOnly,
    });
    const effectivePolicy = {
      ...policy,
      sendInApp: inAppEnabled && policy.sendInApp,
    };

    const doc = await createNotificationDoc({
      user: targetUser,
      payload,
      policy: effectivePolicy,
      context,
      eventKey,
    });

    if (!emailEnabled) {
      return doc;
    }

    if (policy.sendEmailNow) {
      try {
        await sendSingleEmail({ user: targetUser, payload, context });

        if (doc) {
          doc.emailMeta.sentAt = new Date();
          doc.emailMeta.digestStatus = 'sent';
          doc.emailMeta.lastError = null;
          await doc.save();
        }
      } catch (error) {
        if (doc) {
          doc.emailMeta.digestStatus = 'failed';
          doc.emailMeta.lastError = String(
            error.message || 'Email send failed'
          );
          await doc.save();
        }
      }

      return doc;
    }

    if (policy.queueDigest && doc) {
      doc.emailMeta.digestStatus = 'pending';
      doc.emailMeta.digestWindow = policy.digestWindow;
      await doc.save();
    }

    return doc;
  }

  async notifyNewJobMatches({
    userId,
    user = null,
    jobs = [],
    maxNotifications = 5,
  }) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return [];
    }

    const candidates = jobs
      .filter(job => Number(job?.aiAnalysis?.matchScore || 0) >= 70)
      .sort(
        (a, b) =>
          Number(b?.aiAnalysis?.matchScore || 0) -
          Number(a?.aiAnalysis?.matchScore || 0)
      )
      .slice(0, Math.max(1, Number(maxNotifications || 5)));

    const results = [];

    for (const job of candidates) {
      const matchScore = Number(job?.aiAnalysis?.matchScore || 0);
      const jobId = String(job?._id || job?.id || job?.upworkJobId || '');
      const eventKey = `job_alert:${jobId}:${Math.floor(matchScore / 10)}`;

      const notification = await this.dispatch({
        userId,
        user,
        type: 'job_alert',
        eventKey,
        context: {
          jobTitle: job?.title,
          platform: job?.source,
          matchScore,
          snippet: job?.shortDescription || job?.description,
          budgetLabel: this.buildBudgetLabel(job),
          jobUrl: job?.upworkUrl,
          viewJobUrl: job?.upworkUrl || `${FRONTEND_BASE_URL}/job-result`,
          generateProposalUrl: `${FRONTEND_BASE_URL}/job-result`,
          timestamp: new Date(),
        },
      });

      if (notification) results.push(notification);
    }

    return results;
  }

  async notifyProposalSent({ userId, proposal, job }) {
    const proposalId = String(proposal?._id || '');

    return this.dispatch({
      userId,
      type: 'proposal_sent',
      eventKey: `proposal_sent:${proposalId}`,
      context: {
        jobTitle: job?.title,
        platform: job?.source,
        proposalUrl: `${FRONTEND_BASE_URL}/dashboard`,
        sentAt: new Date(),
        timestamp: new Date(),
      },
    });
  }

  async notifyProposalRejected({ userId, proposal, job, reason }) {
    const proposalId = String(proposal?._id || '');

    return this.dispatch({
      userId,
      type: 'proposal_rejected',
      eventKey: `proposal_rejected:${proposalId}`,
      context: {
        jobTitle: job?.title,
        platform: job?.source,
        reason,
        similarJobsUrl: `${FRONTEND_BASE_URL}/dashboard`,
        timestamp: new Date(),
      },
    });
  }

  async scanPendingProposalNotifications({ userId, minHours = 48 }) {
    const thresholdDate = new Date(
      Date.now() - Number(minHours || 48) * 3600000
    );

    const proposals = await Proposal.find({
      userId,
      isActive: true,
      status: { $in: ['sent', 'received', 'viewed'] },
      updatedAt: { $lte: thresholdDate },
    })
      .select('jobId statusHistory updatedAt')
      .lean();

    if (proposals.length === 0) return [];

    const jobIds = proposals.map(item => item.jobId).filter(Boolean);

    const jobs = await Job.find({ _id: { $in: jobIds } })
      .select('_id title source')
      .lean();

    const jobsById = new Map(jobs.map(job => [String(job._id), job]));

    const created = [];

    for (const proposal of proposals) {
      const sentHistory = (proposal.statusHistory || [])
        .filter(item => item.status === 'sent')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      const sentAt = sentHistory?.timestamp || proposal.updatedAt;
      const job = jobsById.get(String(proposal.jobId));
      const proposalId = String(proposal._id);

      const notification = await this.dispatch({
        userId,
        type: 'proposal_pending',
        eventKey: `proposal_pending:${proposalId}:${toMonthKey(sentAt)}`,
        context: {
          jobTitle: job?.title || 'Proposal',
          platform: job?.source || 'N/A',
          sentAt,
          proposalUrl: `${FRONTEND_BASE_URL}/dashboard`,
          timestamp: new Date(),
        },
      });

      if (notification) created.push(notification);
    }

    return created;
  }

  async notifyBillingPaymentFailed({
    userId,
    plan,
    amount,
    currency = 'USD',
    reason,
    dueDate,
  }) {
    return this.dispatch({
      userId,
      type: 'billing_failed',
      eventKey: `billing_failed:${toMonthKey(new Date())}:${plan || 'plan'}`,
      context: {
        plan,
        amount,
        currency,
        reason,
        dueDate,
        timestamp: new Date(),
      },
    });
  }

  async notifyBillingPaymentSuccess({
    userId,
    plan,
    amount,
    currency = 'USD',
    billingPeriod,
    invoiceUrl,
  }) {
    return this.dispatch({
      userId,
      type: 'billing_success',
      eventKey: `billing_success:${toMonthKey(new Date())}:${plan || 'plan'}`,
      context: {
        plan,
        amount,
        currency,
        billingPeriod,
        invoiceUrl,
        timestamp: new Date(),
      },
    });
  }

  async notifyBillingPlanChange({
    userId,
    oldPlan,
    newPlan,
    effectiveDate,
    proratedAmount,
    currency = 'USD',
  }) {
    return this.dispatch({
      userId,
      type: 'billing_plan_change',
      eventKey: `billing_plan_change:${userId}:${newPlan}:${toMonthKey(new Date())}`,
      context: {
        oldPlan,
        newPlan,
        effectiveDate,
        proratedAmount,
        currency,
        timestamp: new Date(),
      },
    });
  }

  async scanBillingWindowNotifications({ userId }) {
    const subscription = await Subscription.findOne({ userId }).lean();
    if (!subscription) return [];

    const created = [];
    const now = new Date();

    if (subscription.currentPeriodEnd) {
      const msUntilRenewal =
        new Date(subscription.currentPeriodEnd).getTime() - now.getTime();
      const daysUntilRenewal = Math.ceil(msUntilRenewal / 86400000);

      if (daysUntilRenewal === 7 || daysUntilRenewal === 1) {
        const plan = getPlanConfig(subscription.plan);
        const result = await this.dispatch({
          userId,
          type: 'billing_renewal',
          eventKey: `billing_renewal:${subscription.plan}:${daysUntilRenewal}:${formatShortDate(
            subscription.currentPeriodEnd
          )}`,
          context: {
            plan: plan?.name || subscription.plan,
            amount: plan?.monthlyPrice,
            currency: 'USD',
            dueDate: subscription.currentPeriodEnd,
            paymentMethod: 'saved card',
            daysUntilRenewal,
            timestamp: now,
          },
        });
        if (result) created.push(result);
      }
    }

    if (subscription.status === 'trialing' && subscription.currentPeriodEnd) {
      const msUntilTrialEnd =
        new Date(subscription.currentPeriodEnd).getTime() - now.getTime();
      const daysLeft = Math.ceil(msUntilTrialEnd / 86400000);

      if (daysLeft === 3 || daysLeft <= 0) {
        const plan = getPlanConfig(subscription.plan);
        const result = await this.dispatch({
          userId,
          type: 'billing_trial_expiry',
          eventKey: `billing_trial_expiry:${subscription.plan}:${Math.max(daysLeft, 0)}:${formatShortDate(
            subscription.currentPeriodEnd
          )}`,
          context: {
            plan: plan?.name || subscription.plan,
            amount: plan?.monthlyPrice,
            currency: 'USD',
            dueDate: subscription.currentPeriodEnd,
            daysLeft,
            timestamp: now,
          },
        });

        if (result) created.push(result);
      }
    }

    return created;
  }

  async notifyUsageThresholdIfNeeded({
    userId,
    month,
    featureName = 'AI proposals',
  }) {
    const targetMonth = month || toMonthKey();

    const [usage, subscription] = await Promise.all([
      UsageRecord.findOne({ userId, month: targetMonth }).lean(),
      Subscription.findOne({ userId }).lean(),
    ]);

    if (!usage || !subscription) return null;

    const plan = getPlanConfig(subscription.plan);
    const planLimit =
      Number(subscription.proposalLimit ?? plan?.proposalLimit ?? 0) || 0;

    if (!planLimit || isUnlimitedPlan(planLimit)) return null;

    const used = Number(usage.aiProposalsUsed || 0);
    const percentUsed = (used / planLimit) * 100;

    if (percentUsed < 80) return null;

    const threshold = percentUsed >= 100 ? 100 : 80;

    return this.dispatch({
      userId,
      type: 'billing_usage_limit',
      eventKey: `billing_usage_limit:${targetMonth}:${threshold}`,
      context: {
        featureName,
        used,
        limit: planLimit,
        percentUsed,
        plan: plan?.name || subscription.plan,
        timestamp: new Date(),
      },
    });
  }

  async sendDigest({ userId, frequency = 'daily' }) {
    const normalizedFrequency =
      String(frequency || 'daily').toLowerCase() === 'weekly'
        ? 'weekly'
        : 'daily';

    const user = await User.findById(userId)
      .select('name email notificationPreferences')
      .lean();

    if (!user || user.notificationPreferences?.emailEnabled === false) {
      return { sent: false, count: 0 };
    }

    const now = new Date();
    const rangeStart = new Date(
      now.getTime() - (normalizedFrequency === 'weekly' ? 7 : 1) * 86400000
    );

    const notifications = await Notification.find({
      userId,
      read: false,
      timestamp: { $gte: rangeStart, $lte: now },
      'emailMeta.digestStatus': 'pending',
      'emailMeta.digestWindow': normalizedFrequency,
    })
      .sort({ timestamp: -1 })
      .lean();

    if (notifications.length === 0) {
      return { sent: false, count: 0 };
    }

    const grouped = notifications.reduce(
      (acc, item) => {
        if (item.group === 'new_jobs') acc.newJobs += 1;
        if (item.group === 'proposals') acc.proposals += 1;
        if (item.group === 'billing') acc.billing += 1;
        return acc;
      },
      { newJobs: 0, proposals: 0, billing: 0 }
    );

    const topCards = notifications
      .slice(0, 8)
      .map(
        item => `
          <div style="padding:10px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;">
            <strong>${item.title}</strong>
            <p style="margin:6px 0 0 0;color:#334155;">${item.body}</p>
          </div>
        `
      )
      .join('');

    const subject =
      normalizedFrequency === 'weekly'
        ? 'Weekly Digest: Jobs, Proposals, and Billing Updates'
        : 'Daily Digest: Jobs, Proposals, and Billing Updates';

    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:680px;margin:0 auto;padding:20px;">
        <h2 style="margin:0 0 10px 0;color:#0f172a;">Notification Digest</h2>
        <p style="color:#334155;">Hi ${trimText(user.name || 'there', 40)}, here is your latest summary.</p>
        <ul style="color:#334155;line-height:1.6;">
          <li>New Jobs: ${grouped.newJobs}</li>
          <li>Proposals: ${grouped.proposals}</li>
          <li>Billing: ${grouped.billing}</li>
        </ul>
        ${topCards}
        <p style="margin-top:14px;"><a href="${FRONTEND_BASE_URL}/dashboard">Open Dashboard</a></p>
      </div>
    `;

    const text = `Hi ${user.name || 'there'},\n\nNew Jobs: ${grouped.newJobs}\nProposals: ${grouped.proposals}\nBilling: ${grouped.billing}\n\nOpen dashboard: ${FRONTEND_BASE_URL}/dashboard`;

    await sendMail({
      to: user.email,
      subject,
      text,
      html,
    });

    const ids = notifications.map(item => item._id);

    await Notification.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          'emailMeta.digestStatus': 'sent',
          'emailMeta.sentAt': new Date(),
          'emailMeta.lastError': null,
        },
      }
    );

    return { sent: true, count: ids.length };
  }

  async listForDrawer({ userId, filters = {}, page = 1, limit = 20 }) {
    const query = { userId };

    if (filters.type) query.type = String(filters.type);
    if (filters.group) query.group = String(filters.group);
    if (filters.priority) query.priority = String(filters.priority);
    if (typeof filters.read === 'boolean') query.read = filters.read;

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const parsedLimit = Math.min(100, Math.max(1, Number(limit)));

    const [items, total] = await Promise.all([
      Notification.find(query)
        .sort({ timestamp: -1, createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return {
      items: items.map(toClientPayload),
      total,
      page: Math.max(1, Number(page)),
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit),
      emptyStateMessage:
        items.length === 0
          ? 'No notifications yet. New alerts will appear here.'
          : null,
    };
  }

  async unreadSummary({ userId }) {
    const [unreadCount, grouped] = await Promise.all([
      Notification.countDocuments({ userId, read: false }),
      Notification.aggregate([
        { $match: { userId, read: false } },
        { $group: { _id: '$group', count: { $sum: 1 } } },
      ]),
    ]);

    const groupedMap = grouped.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      { new_jobs: 0, proposals: 0, billing: 0 }
    );

    return {
      unreadCount,
      grouped: groupedMap,
    };
  }

  async markRead({ userId, notificationId }) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    return notification ? toClientPayload(notification) : null;
  }

  async markAllRead({ userId, group = null }) {
    const query = { userId, read: false };
    if (group) query.group = String(group);

    const result = await Notification.updateMany(query, {
      $set: {
        read: true,
        readAt: new Date(),
      },
    });

    return result.modifiedCount || 0;
  }

  async deleteOne({ userId, notificationId }) {
    const result = await Notification.deleteOne({
      _id: notificationId,
      userId,
    });

    return (result.deletedCount || 0) > 0;
  }

  async deleteAll({ userId, group = null }) {
    const query = { userId };
    if (group) query.group = String(group);

    const result = await Notification.deleteMany(query);
    return result.deletedCount || 0;
  }

  buildBudgetLabel(job) {
    if (!job) return 'Budget not listed';

    if (job.budgetType === 'fixed') {
      return (
        formatMoney(job.budget?.amount, job.budget?.currency || 'USD') ||
        'Fixed budget'
      );
    }

    if (job.budgetType === 'hourly') {
      const min = Number(job.hourlyRate?.min || 0);
      const max = Number(job.hourlyRate?.max || 0);
      const currency = job.hourlyRate?.currency || 'USD';

      if (min > 0 && max > 0) {
        return `${formatMoney(min, currency)} - ${formatMoney(max, currency)} /hr`;
      }

      return 'Hourly budget';
    }

    return 'Budget not listed';
  }
}

const notificationService = new NotificationService();

export default notificationService;
export { toClientPayload };
