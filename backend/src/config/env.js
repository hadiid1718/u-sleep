import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..', '..');
const runtimeNodeEnv = String(process.env.NODE_ENV || 'development')
  .replace(/^['"]|['"]$/g, '')
  .trim();
const envFilePath = path.resolve(backendRoot, `.env.${runtimeNodeEnv}`);

dotenv.config({ path: envFilePath });

export const {
  PORT,
  FRONTEND_URL,
  NODE_ENV,
  DB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ARCJET_KEY,
  ARCJET_ENV,

  // OpenAI
  OPENAI_API_KEY,
  OPENAI_MODEL,
  OPENAI_ORG_ID,

  // Google Gemini
  GOOGLE_GEMINI_API_KEY,
  GOOGLE_GEMINI_MODEL,

  // Google OAuth
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_OAUTH_REDIRECT_URI,
  GOOGLE_OAUTH_SUCCESS_REDIRECT_URL,
  GOOGLE_OAUTH_FAILURE_REDIRECT_URL,

  // Feature Flags
  USE_BACKGROUND_JOBS,
  JOB_CACHE_TTL,
  JOB_CACHE_ENABLED,
  PROPOSAL_GENERATION_TIMEOUT,

  // Stripe
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_STARTER_PRICE_ID,
  STRIPE_PRO_PRICE_ID,
  STRIPE_AGENCY_PRICE_ID,
  CLIENT_URL,

  // Upstash
  QSTASH_URL,
  QSTASH_TOKEN,

  // App URL (for workflow triggers)
  APP_URL,

  // Nodemailer (SMTP)
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,

  // Upwork OAuth
  UPWORK_API_KEY,
  UPWORK_API_SECRET,
  UPWORK_ACCESS_TOKEN,
  UPWORK_REFRESH_TOKEN,
  UPWORK_CLIENT_ID,
  UPWORK_CLIENT_SECRET,
  UPWORK_OAUTH_REDIRECT_URI,

  // Freelancer API & OAuth
  FREELANCER_BASE_URL,
  FREELANCER_ACCOUNTS_BASE_URL,
  FREELANCER_CLIENT_ID,
  FREELANCER_CLIENT_SECRET,
  FREELANCER_OAUTH_REDIRECT_URI,
  FREELANCER_OAUTH_SCOPE,
  FREELANCER_OAUTH_ADVANCED_SCOPES,
  FREELANCER_OAUTH_PROMPT,
  FREELANCER_OAUTH_ACCESS_TOKEN,
} = process.env;
