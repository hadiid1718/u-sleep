import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectToDatabase from '../config/db.js';
import User from '../models/user.model.js';
import Subscription from '../models/subscription.model.js';
import { getPlanConfig } from '../utils/subscriptionPlans.js';

const EMAIL = process.env.SEED_PRO_EMAIL || 'hadeed.hassan189@gmail.com';
const PASSWORD = process.env.SEED_PRO_PASSWORD || 'Ha718191';
const NAME = process.env.SEED_PRO_NAME || 'Seed Pro User';
const RESET_PASSWORD = process.env.SEED_PRO_RESET_PASSWORD === 'true';

const seedProUser = async () => {
  try {
    await connectToDatabase();

    const normalizedEmail = String(EMAIL || '').trim().toLowerCase();
    const normalizedPassword = String(PASSWORD || '').trim();

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error('SEED_PRO_EMAIL and SEED_PRO_PASSWORD are required.');
    }

    const plan = getPlanConfig('pro');
    if (!plan) {
      throw new Error('Pro plan configuration is missing.');
    }

    let user = await User.findOne({ email: normalizedEmail });
    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    if (!user) {
      user = await User.create({
        name: NAME,
        email: normalizedEmail,
        password: hashedPassword,
        authProvider: 'local',
        isEmailVerified: true,
      });
      console.log(`Created seed user: ${normalizedEmail}`);
    } else {
      if (!user.password || RESET_PASSWORD) {
        user.password = hashedPassword;
        user.authProvider = user.authProvider === 'local' ? 'local' : 'both';
        user.isEmailVerified = true;
        await user.save();
        console.log(`Updated password for seed user: ${normalizedEmail}`);
      } else {
        console.log(`Seed user already exists: ${normalizedEmail}`);
      }
    }

    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          plan: 'pro',
          status: 'active',
          autoSendEnabled: plan.autoSendEnabled,
          platformLimit: plan.platformLimit,
          proposalLimit: plan.proposalLimit,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Seeded Pro subscription for user.');
  } catch (error) {
    console.error('Failed to seed pro user:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedProUser();
