import app from './app.js';
import { PORT } from './config/env.js';
import connectToDatabase from './config/db.js';
import logger from './config/logger.js';

app.listen(PORT, async () => {
  logger.info(`U Sleep Automation Tool API is running on: http://localhost:${PORT}` );
  await connectToDatabase();
});
