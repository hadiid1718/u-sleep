export const PLAN_ORDER = ['starter', 'pro', 'agency'];

export const PLAN_CONFIG = {
  starter: {
    planId: 'starter',
    name: 'Starter',
    monthlyPrice: 19,
    proposalLimit: 30,
    platformLimit: 1,
    autoSendEnabled: false,
    features: [
      '30 AI proposals / month',
      'Manual copy only',
      '1 platform connection',
    ],
  },
  pro: {
    planId: 'pro',
    name: 'Pro',
    monthlyPrice: 49,
    proposalLimit: 150,
    platformLimit: 2,
    autoSendEnabled: true,
    features: [
      '150 AI proposals / month',
      'Direct send enabled',
      'Upwork + Freelancer',
    ],
  },
  agency: {
    planId: 'agency',
    name: 'Agency',
    monthlyPrice: 99,
    proposalLimit: -1,
    platformLimit: 2,
    autoSendEnabled: true,
    features: [
      'Unlimited AI proposals',
      'Direct send enabled',
      'Upwork + Freelancer',
    ],
  },
};

export const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'];

export const toMonthKey = (date = new Date()) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const nextMonthResetDate = (from = new Date()) => {
  const reset = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1)
  );
  return reset;
};

export const isUnlimitedPlan = proposalLimit => proposalLimit === -1;

export const getPlanConfig = planId => PLAN_CONFIG[planId] || null;

export const getPlanRank = planId => PLAN_ORDER.indexOf(planId);
