import app from './app.js';
import { PORT } from './config/env.js';
import connectToDatabase from './database/mongodb.js';
import { createDefaultAdmin } from './controller/auth.controller.js';
import logger from './config/logger.js';

app.listen(PORT, async () => {
  logger.info(`U Sleep Automation Tool API is running on: http://localhost:${PORT}`);

  // Database connection function calling
  await connectToDatabase();
  await createDefaultAdmin();
});
