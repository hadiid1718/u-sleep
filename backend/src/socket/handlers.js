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
  // Map to track connected users and admins
  const userSockets = new Map(); // userId -> socket.id
  const adminSockets = new Map(); // adminId -> socket.id

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

      // Notify admins that this user is online
      io.to('admins').emit('user-online', {
        userId: String(user._id),
        userName: user.name || user.email,
        timestamp: new Date(),
      });
    }

    // ========================
    // ADMIN AUTHENTICATION
    // ========================
    const admin = await extractAdminFromSocket(socket);
    if (admin) {
      adminSockets.set(String(admin.id), socket.id);
      socket.join('admins');
      console.log(`[Socket] Admin ${admin.id} authenticated`);

      // Notify other admins
      socket.to('admins').emit('admin-online', {
        adminId: String(admin.id),
        timestamp: new Date(),
      });
    }

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

      // Broadcast to all admins that a new message arrived
      io.to('admins').emit('support-chat:new-user-message', {
        userId: String(user._id),
        userName: user.name || user.email,
        message,
        timestamp: new Date(),
      });

      // Notify this user's chat room
      io.to(`user:${user._id}`).emit('support-chat:message-sent', {
        message,
        sender: 'user',
        timestamp: new Date(),
      });
    });

    // Admin: Send reply to a specific user
    socket.on('support-chat:send-admin-reply', async (data) => {
      if (!admin) {
        socket.emit('error', { message: 'Not authenticated as admin' });
        return;
      }

      const { userId, message } = data;
      if (!userId || !message) return;

      // Notify the user
      io.to(`user:${userId}`).emit('support-chat:new-admin-reply', {
        message,
        sender: 'admin',
        timestamp: new Date(),
      });

      // Notify all admins (for transparency)
      io.to('admins').emit('support-chat:admin-reply-sent', {
        adminId: String(admin.id),
        userId,
        message,
        timestamp: new Date(),
      });
    });

    // Admin: Request to see user's chat history (optional, mainly for UI sync)
    socket.on('support-chat:request-user-history', async (data) => {
      if (!admin) {
        socket.emit('error', { message: 'Not authenticated as admin' });
        return;
      }

      const { userId } = data;
      // Admins can emit this to sync UI; actual data comes from REST API
      socket.emit('support-chat:history-requested', { userId });
    });

    // ========================
    // DISCONNECTION
    // ========================
    socket.on('disconnect', () => {
      if (user) {
        userSockets.delete(String(user._id));
        io.to('admins').emit('user-offline', {
          userId: String(user._id),
          timestamp: new Date(),
        });
        console.log(`[Socket] User ${user._id} disconnected`);
      }

      if (admin) {
        adminSockets.delete(String(admin.id));
        io.to('admins').emit('admin-offline', {
          adminId: String(admin.id),
          timestamp: new Date(),
        });
        console.log(`[Socket] Admin ${admin.id} disconnected`);
      }
    });
  });
};

export default initializeSocketHandlers;
