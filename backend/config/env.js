import dotenv from "dotenv";

dotenv.config({path:`.env.${process.env.NODE_ENV || 'development'}.local`});

export const {
    PORT,FRONTEND_URL,
    NODE_ENV,
    DB_URI,
    JWT_SECRET,JWT_EXPIRES_IN,
    ADMIN_USERNAME,ADMIN_PASSWORD,
    ARCJET_KEY,ARCJET_ENV
    } = process.env;