import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import User from '../models/user.model.js';

const extractUserFromSocket = async (socket) => {
  try {
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.userId) return null;
    
    const user = await User.findById(decoded.userId);
    return user || null;
  } catch {
    return null;
  }
};

const extractAdminFromSocket = async (socket) => {
  try {
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.adminId) return null;
    
    // For now, we check if the user is admin by a flag (you can add role checking)
    return { id: decoded.adminId, token };
  } catch {
    return null;
  }
};

const initializeSocketHandlers = (io) => {
  // Map to track connected users
  const userSockets = new Map(); // userId -> socket.id

  io.on('connection', async (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // ========================
    // USER AUTHENTICATION
    // ========================
    const user = await extractUserFromSocket(socket);
    if (user) {
      userSockets.set(String(user._id), socket.id);
      socket.join(`user:${user._id}`);
      console.log(`[Socket] User ${user._id} authenticated`);
    }

    // ========================
    // ADMIN AUTHENTICATION
    // ========================
    // Admin sockets and admin events removed (admin UI deprecated)

    // ========================
    // SUPPORT CHAT EVENTS
    // ========================

    // Client: User sends a message (should be also sent via REST API)
    socket.on('support-chat:send-user-message', async (data) => {
      if (!user) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { message } = data;
      if (!message) return;

      // Notify this user's chat room
      io.to(`user:${user._id}`).emit('support-chat:message-sent', {
        message,
        sender: 'user',
        timestamp: new Date(),
      });
    });
    // Admin events removed

    // ========================
    // DISCONNECTION
    // ========================
    socket.on('disconnect', () => {
      if (user) {
        userSockets.delete(String(user._id));
        console.log(`[Socket] User ${user._id} disconnected`);
      }
    });
  });
};

export default initializeSocketHandlers;
