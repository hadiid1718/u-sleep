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
import paymentRouter from './routes/payment.router.js';
import { subscriptionWorkflow } from './workflows/subscription.workflow.js';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middleware/error.middleware.js';
import arcjetMiddleware from './middleware/arcject.middleware.js';

const app = express();

// CORS configuration
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  morgan('combined', {
    stream: { write: message => console.log(message.trim()) },
  })
);

app.use(cookieParser());
app.use(arcjetMiddleware);
app.use(helmet());
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/demo', demoRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/proposals', proposalRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/comparisons', comparisonRouter);
app.use('/api/v1/review-video', reviewVideoRouter);
app.use('/api/v1/payments', paymentRouter);

// Upstash Workflow endpoint – subscription expiry reminders
app.use('/api/v1/workflows/subscription', subscriptionWorkflow);

app.use(errorMiddleware);

app.get('/', (req, res) => {
  res.send('Welcome to U Sleep || Upwork Automation APIs!');
});

export default app;
