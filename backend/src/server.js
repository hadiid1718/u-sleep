import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { PORT, FRONTEND_URL } from './config/env.js';
import connectToDatabase from './config/db.js';
import logger from './config/logger.js';
import initializeSocketHandlers from './socket/handlers.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Attach io to app for use in controllers
app.locals.io = io;

initializeSocketHandlers(io);

server.listen(PORT, async () => {
  logger.info(
    `U Sleep Automation Tool API is running on: http://localhost:${PORT}`
  );
  await connectToDatabase();
});
