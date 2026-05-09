import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { FRONTEND_URL } from './config/env.js';

import userRouter from './routes/user.router.js';
import authRouter from './routes/auth.router.js';
import demoRouter from './routes/demo.router.js';
import jobRouter from './routes/job.router.js';
import proposalRouter from './routes/proposal.router.js';
import productRouter from './routes/product.router.js';
import comparisonRouter from './routes/comparison.router.js';
import reviewVideoRouter from './routes/reviewVideo.router.js';
import billingRouter from './routes/billing.router.js';
import webhookRouter from './routes/webhook.router.js';
import notificationRouter from './routes/notification.router.js';
import adminRouter from './routes/admin.router.js';
import supportRouter from './routes/support.router.js';
import adminSubscriptionRouter from './routes/admin.subscription.router.js';
import userSubscriptionRouter from './routes/user.subscription.router.js';
import suspensionRouter from './routes/suspension.router.js';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middleware/error.middleware.js';
import arcjetMiddleware from './middleware/arcject.middleware.js';
import metricsMiddleware from './middleware/metrics.middleware.js';

const app = express();

// CORS configuration
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  morgan('combined', {
    stream: { write: message => console.log(message.trim()) },
  })
);
// SECURITY MIDDLEWARE
app.use(cookieParser());
app.use('/webhooks', webhookRouter);
app.use(arcjetMiddleware);
app.use(helmet());
app.use(metricsMiddleware);
app.use(errorMiddleware);

// ACCESS POINTS
app.get('/api', (req, res) => {
  res.send('Welcome to U Sleep || Upwork Automation APIs!');
});

//HEALTH CHECK

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});
// API ROUTES
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/demo', demoRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/proposals', proposalRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/comparisons', comparisonRouter);
app.use('/api/v1/review-video', reviewVideoRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/admin/subscriptions', adminSubscriptionRouter);
app.use('/api/v1/user', userSubscriptionRouter);
app.use('/api/v1/support', supportRouter);
app.use('/api/v1/suspension', suspensionRouter);

export default app;
