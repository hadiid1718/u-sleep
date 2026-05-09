import Stripe from 'stripe';
import {
  STRIPE_SECRET_KEY,
  STRIPE_STARTER_PRICE_ID,
  STRIPE_PRO_PRICE_ID,
  STRIPE_AGENCY_PRICE_ID,
  CLIENT_URL,
  FRONTEND_URL,
} from './env.js';
import { getPlanConfig } from '../utils/subscriptionPlans.js';

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY);

export const PRICE_IDS = {
  starter: STRIPE_STARTER_PRICE_ID,
  pro: STRIPE_PRO_PRICE_ID,
  agency: STRIPE_AGENCY_PRICE_ID,
};

export const CLIENT_APP_URL =
  CLIENT_URL || FRONTEND_URL || 'http://localhost:5173';

export const getPriceIdByPlan = planId => PRICE_IDS[planId] || null;

export const getPlanByPriceId = priceId => {
  const entry = Object.entries(PRICE_IDS).find(([, id]) => id === priceId);
  return entry ? entry[0] : null;
};

export const isPlanConfigured = planId => {
  const priceId = getPriceIdByPlan(planId);
  const plan = getPlanConfig(planId);
  return Boolean(priceId && plan);
};

// Warn at startup if any plan price ids are missing — helps diagnose misconfigured env files
const missingPlans = Object.entries(PRICE_IDS)
  .filter(([, id]) => !id)
  .map(([plan]) => plan);

if (missingPlans.length > 0) {
  // don't throw (so dev servers still run) — but make the issue very visible in logs
  // Example message: [Stripe] Missing price ids for plans: agency, pro
  // Users should add STRIPE_STARTER_PRICE_ID / STRIPE_PRO_PRICE_ID / STRIPE_AGENCY_PRICE_ID to their env

  console.warn(
    `[Stripe] Missing price ids for plans: ${missingPlans.join(', ')}. ` +
      'Set STRIPE_STARTER_PRICE_ID, STRIPE_PRO_PRICE_ID and STRIPE_AGENCY_PRICE_ID in your backend env file.'
  );
}
