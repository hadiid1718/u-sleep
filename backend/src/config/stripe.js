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
