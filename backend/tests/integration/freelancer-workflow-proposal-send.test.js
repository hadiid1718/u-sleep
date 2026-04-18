import assert from 'node:assert/strict';
import test from 'node:test';

import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { JWT_SECRET } from '../../src/config/env.js';
import jobRouter from '../../src/routes/job.router.js';
import proposalRouter from '../../src/routes/proposal.router.js';
import errorMiddleware from '../../src/middleware/error.middleware.js';
import Job from '../../src/models/job.model.js';
import Proposal from '../../src/models/proposal.model.js';
import Subscription from '../../src/models/subscription.model.js';
import User from '../../src/models/user.model.js';
import UsageRecord from '../../src/models/usageRecord.model.js';

const createApiApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/jobs', jobRouter);
  app.use('/api/v1/proposals', proposalRouter);
  app.use(errorMiddleware);
  return app;
};

const authHeaderForUser = userId => {
  const token = jwt.sign({ userId: String(userId) }, JWT_SECRET);
  return `Bearer ${token}`;
};

const createFreelancerSendFixture = async (overrides = {}) => {
  const user = await User.create({
    name: 'Test User',
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    password: 'password123',
    jobPreferences: {
      selectedPlatform: 'freelancer',
      keywords: ['react'],
      userRole: 'freelancer',
      rateType: 'fixed',
      fixedRate: 300,
    },
    ...overrides.user,
  });

  const job = await Job.create({
    upworkJobId: `freelancer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    source: 'freelancer_api',
    sourceJobId: String(Date.now()),
    upworkUrl: 'https://www.freelancer.com/projects/test-project',
    title: 'Build Landing Page',
    description: 'Need an experienced React developer for a landing page.',
    budgetType: 'fixed',
    budget: {
      amount: 500,
      currency: 'USD',
    },
    userId: user._id,
    ...overrides.job,
  });

  const proposal = await Proposal.create({
    userId: user._id,
    jobId: job._id,
    upworkJobId: job.upworkJobId,
    content: 'Tailored bid content for client.',
    status: 'draft',
    statusHistory: [
      {
        status: 'draft',
        timestamp: new Date(),
        notes: 'Draft created',
      },
    ],
    ...overrides.proposal,
  });

  await Subscription.create({
    userId: user._id,
    plan: 'pro',
    status: 'active',
    autoSendEnabled: true,
    platformLimit: 2,
    proposalLimit: 300,
    ...overrides.subscription,
  });

  return { user, job, proposal };
};

let mongoServer;
let app;

test.before(async () => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required for integration tests.');
  }

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = createApiApp();
});

test.beforeEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map(collection => collection.deleteMany({})));
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('GET /api/v1/jobs/freelancer/workflow returns search workflow guidance', async () => {
  const response = await request(app)
    .get('/api/v1/jobs/freelancer/workflow')
    .query({
      keywords: 'react,node',
      selectedRole: 'freelancer',
      rateType: 'hourly',
    })
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.data.platform, 'freelancer');
  assert.equal(response.body.data.workflowType, 'job-discovery');
  assert.equal(response.body.data.searchContext.rateType, 'hourly');
  assert.deepEqual(response.body.data.searchContext.keywords, ['react', 'node']);
  assert.ok(Array.isArray(response.body.data.steps));
  assert.ok(response.body.data.steps.length >= 4);
});

test('POST /api/v1/proposals/:proposalId/send validates missing bidAmount for Freelancer', async () => {
  const { user, proposal } = await createFreelancerSendFixture();

  const response = await request(app)
    .post(`/api/v1/proposals/${proposal._id}/send`)
    .set('Authorization', authHeaderForUser(user._id))
    .send({
      platform: 'freelancer',
      estimatedDuration: '5 days',
    })
    .expect(400);

  assert.equal(response.body.success, false);
  assert.match(response.body.error, /Bid amount is required/i);
});

test('POST /api/v1/proposals/:proposalId/send validates missing duration and deliveryDate for Freelancer', async () => {
  const { user, proposal } = await createFreelancerSendFixture();

  const response = await request(app)
    .post(`/api/v1/proposals/${proposal._id}/send`)
    .set('Authorization', authHeaderForUser(user._id))
    .send({
      platform: 'freelancer',
      bidAmount: 250,
    })
    .expect(400);

  assert.equal(response.body.success, false);
  assert.match(
    response.body.error,
    /Estimated duration or delivery date is required/i
  );
});

test('POST /api/v1/proposals/:proposalId/send succeeds with Freelancer bid + duration and returns workflow', async () => {
  const { user, proposal } = await createFreelancerSendFixture();

  const response = await request(app)
    .post(`/api/v1/proposals/${proposal._id}/send`)
    .set('Authorization', authHeaderForUser(user._id))
    .send({
      platform: 'freelancer',
      bidAmount: 275,
      estimatedDuration: '6 days',
    })
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.data?.proposal?.status, 'sent');
  assert.equal(response.body.data?.proposal?.bidAmount, 275);
  assert.equal(response.body.data?.proposal?.estimatedDuration, '6 days');
  assert.equal(response.body.data?.workflow?.platform, 'freelancer');
  assert.equal(response.body.data?.workflow?.workflowType, 'proposal-writing');

  const storedProposal = await Proposal.findById(proposal._id).lean();
  assert.equal(storedProposal.status, 'sent');

  const usageRecord = await UsageRecord.findOne({ userId: user._id }).lean();
  assert.ok(usageRecord);
  assert.ok((usageRecord.platformsConnected || []).includes('freelancer'));
});
