import dotenv from "dotenv";

dotenv.config({path:`.env.${process.env.NODE_ENV || 'development'}.local`});

export const {
    PORT,FRONTEND_URL,
    NODE_ENV,
    DB_URI,
    JWT_SECRET,JWT_EXPIRES_IN,
    ADMIN_USERNAME,ADMIN_PASSWORD,
    ARCJET_KEY,ARCJET_ENV,
    
    // Upwork API
    UPWORK_API_KEY,
    UPWORK_API_SECRET,
    UPWORK_CLIENT_ID,
    UPWORK_CLIENT_SECRET,
    UPWORK_ACCESS_TOKEN,
    UPWORK_REFRESH_TOKEN,
    
    // OpenAI
    OPENAI_API_KEY,
    OPENAI_MODEL,
    OPENAI_ORG_ID,
    
    // Google Gemini
    GOOGLE_GEMINI_API_KEY,
    GOOGLE_GEMINI_MODEL,
    
    // Feature Flags
    USE_BACKGROUND_JOBS,
    JOB_CACHE_TTL,
    JOB_CACHE_ENABLED,
    PROPOSAL_GENERATION_TIMEOUT
    } = process.env;