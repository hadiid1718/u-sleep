import mongoose from 'mongoose';
import connectToDatabase from '../config/db.js';
import BillingPlan from '../models/billingPlan.model.js';
import { PLAN_CONFIG } from '../utils/subscriptionPlans.js';
import { getPriceIdByPlan } from '../config/stripe.js';

const buildPlanDocs = () => {
  const missingPricePlans = [];

  return Object.values(PLAN_CONFIG).map(plan => {
    const stripePriceId = getPriceIdByPlan(plan.planId);

    if (!stripePriceId) {
      missingPricePlans.push(plan.planId);
    }

    const planDoc = {
      planId: plan.planId,
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      stripePriceId: stripePriceId || null,
      proposalLimit: plan.proposalLimit,
      platformLimit: plan.platformLimit,
      autoSendEnabled: plan.autoSendEnabled,
      features: plan.features,
      isActive: true,
    };

    if (
      missingPricePlans.length > 0 &&
      missingPricePlans.includes(plan.planId)
    ) {
      console.warn(
        `[seed:billing] Missing STRIPE_${plan.planId.toUpperCase()}_PRICE_ID. Seeded plan metadata with null stripePriceId for "${plan.planId}".`
      );
    }

    return planDoc;
  });
};

const seedBillingPlans = async () => {
  try {
    await connectToDatabase();

    const plans = buildPlanDocs();

    const operations = plans.map(plan => ({
      updateOne: {
        filter: { planId: plan.planId },
        update: { $set: plan },
        upsert: true,
      },
    }));

    await BillingPlan.bulkWrite(operations);

    console.log(`Seeded ${plans.length} billing plans successfully.`);
  } catch (error) {
    console.error('Failed to seed billing plans:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedBillingPlans();
