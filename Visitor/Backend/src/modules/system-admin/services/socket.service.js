const logger = require('../../../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> { socketId, userRole, orgId, status }
  }

  initialize(ioInstance) {
    this.io = ioInstance;
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Handle Authentication & Join Rooms
      socket.on('authenticate', (userData) => {
        const { userId, role, orgId, email } = userData || {};
        if (userId) {
          this.connectedUsers.set(String(userId), {
            socketId: socket.id,
            userRole: role || 'user',
            orgId: orgId || 'default',
            email: email || '',
            status: 'online',
            connectedAt: new Date().toISOString()
          });

          socket.join(`user_${userId}`);
          socket.join(`user:${userId}`);
          if (email) {
            socket.join(`email_${email}`);
          }
          if (role) {
            socket.join(`role_${role}`);
            socket.join(`role:${role}`);
          }
          if (orgId) socket.join(`org_${orgId}`);

          logger.info(`User ${userId} authenticated on socket ${socket.id}`);
          this.broadcastPresence(userId, 'online');
        } else if (email) {
          socket.join(`email_${email}`);
          if (role) {
            socket.join(`role_${role}`);
            socket.join(`role:${role}`);
          }
          logger.info(`Guest ${email} joined email room on socket ${socket.id}`);
        }
      });

      socket.on('join-user', (userId) => {
        if (userId) {
          socket.join(`user_${userId}`);
          socket.join(`user:${userId}`);
          logger.info(`Socket ${socket.id} joined user rooms for ${userId}`);
        }
      });

      socket.on('join-role', (role) => {
        if (role) {
          socket.join(`role_${role}`);
          socket.join(`role:${role}`);
          logger.info(`Socket ${socket.id} joined role rooms for ${role}`);
        }
      });

      socket.on('join_room', (room) => {
        if (room) {
          socket.join(room);
          logger.info(`Socket ${socket.id} joined room ${room}`);
        }
      });

      socket.on('leave_room', (room) => {
        if (room) {
          socket.leave(room);
          logger.info(`Socket ${socket.id} left room ${room}`);
        }
      });

      socket.on('mark_read', async ({ conversationId, userId }) => {
        if (conversationId && userId) {
          try {
            const db = require('../../../config/db');
            await db.query(
              `UPDATE chat_participants SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?`,
              [conversationId, userId]
            );
            this.emitToRoom(`conv:${conversationId}`, 'messages_read', {
              conversationId: Number(conversationId),
              userId: Number(userId),
              readAt: new Date().toISOString()
            });
          } catch (e) {}
        }
      });

      // Handle Presence Updates
      socket.on('presence_update', ({ userId, status }) => {
        const uidStr = String(userId);
        if (this.connectedUsers.has(uidStr)) {
          const u = this.connectedUsers.get(uidStr);
          u.status = status || 'online';
          this.broadcastPresence(userId, status);
        }
      });

      // Handle Disconnection
      socket.on('disconnect', () => {
        for (const [uid, udata] of this.connectedUsers.entries()) {
          if (udata.socketId === socket.id) {
            this.broadcastPresence(uid, 'offline');
            this.connectedUsers.delete(uid);
            logger.info(`User ${uid} disconnected from socket ${socket.id}`);
            break;
          }
        }
      });
    });
  }

  broadcastPresence(userId, status) {
    if (this.io) {
      this.io.emit('presence_change', { userId, status, timestamp: new Date().toISOString() });
    }
  }

  sendToUser(userId, event, payload) {
    return this.emitToUser(userId, event, payload);
  }

  emitToUser(userId, event, payload) {
    if (this.io && userId) {
      const eventName = event || 'notification';
      this.io.to(`user_${userId}`).to(`user:${userId}`).emit(eventName, payload);
      const isChatEvent = eventName.startsWith('chat_') || eventName.includes('chat_message');
      if (eventName !== 'notification' && !isChatEvent) {
        this.io.to(`user_${userId}`).to(`user:${userId}`).emit('notification', payload);
      }
    }
  }

  emitToRole(role, event, payload) {
    if (this.io && role) {
      const eventName = event || 'notification';
      this.io.to(`role_${role}`).to(`role:${role}`).emit(eventName, payload);
      const isChatEvent = eventName.startsWith('chat_') || eventName.includes('chat_message');
      if (eventName !== 'notification' && !isChatEvent) {
        this.io.to(`role_${role}`).to(`role:${role}`).emit('notification', payload);
      }
    }
  }

  emitToOrg(orgId, event, payload) {
    if (this.io && orgId) {
      this.io.to(`org_${orgId}`).emit(event || 'notification', payload);
    }
  }

  emitToRoom(roomName, event, payload) {
    if (this.io && roomName) {
      const eventName = event || 'notification';
      this.io.to(roomName).emit(eventName, payload);
    }
  }

  broadcastLiveNotification(notification) {
    if (this.io) {
      this.io.emit('live_notification', notification);
      this.io.emit('notification', notification);
    }
  }

  getPresence(userId) {
    return this.connectedUsers.get(String(userId)) || { status: 'offline' };
  }

  getActiveSessionsCount() {
    return this.connectedUsers.size;
  }
}

module.exports = new SocketService();
