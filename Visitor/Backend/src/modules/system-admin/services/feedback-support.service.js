const repository = require('../repositories/feedback-support.repository');
const notificationService = require('../../notifications/services/notification.service');
const socketService = require('./socket.service');
const db = require('../../../config/db');

class FeedbackSupportService {
  async _resolveUserDetails(userId, fallbackData = {}) {
    if (!userId) return null;
    try {
      if (db && !db.useMock) {
        const [users] = await db.query(
          `SELECT id, name, email, role, department_name, avatar_url, phone_number, user_code 
           FROM users WHERE id = ? LIMIT 1`,
          [userId]
        );
        if (users && users[0]) return users[0];
      }
    } catch (e) {
      // ignore user lookup error
    }
    return null;
  }

  async submitFeedback(data, currentUser = null) {
    if (!data.subject || !data.message) {
      throw new Error('Subject and message are required.');
    }

    const userId = currentUser?.id || data.user_id || null;
    const dbUser = await this._resolveUserDetails(userId);

    const userName = data.user_name || dbUser?.name || currentUser?.name || currentUser?.username || 'System User';
    const userEmail = data.user_email || dbUser?.email || currentUser?.email || 'user@vms.com';
    const userRole = (data.role_name || dbUser?.role || currentUser?.role || 'USER').toUpperCase();
    const userCode = data.user_code || dbUser?.user_code || (userId ? `${userRole.slice(0, 3)}${String(userId).padStart(6, '0')}` : null);
    const avatarUrl = data.avatar_url || dbUser?.avatar_url || currentUser?.avatar_url || null;
    const phoneNumber = data.phone_number || dbUser?.phone_number || currentUser?.phone_number || null;
    const departmentName = data.department_name || dbUser?.department_name || currentUser?.department_name || null;

    const payload = {
      user_id: userId,
      user_code: userCode,
      avatar_url: avatarUrl,
      phone_number: phoneNumber,
      user_name: userName,
      user_email: userEmail,
      role_name: userRole,
      department_name: departmentName,
      category: data.category || 'GENERAL_FEEDBACK',
      rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
      subject: String(data.subject).trim(),
      message: String(data.message).trim()
    };

    const feedback = await repository.createFeedback(payload);

    // 1. Dispatch in-app notification to Administrators
    try {
      await notificationService.dispatchBusinessNotification(
        'FEEDBACK_SUBMITTED',
        null, // broadcast to admins
        {
          title: `New Feedback from ${userName} (${userRole})`,
          message: `[${payload.category}] ${payload.subject}: "${payload.message.substring(0, 100)}${payload.message.length > 100 ? '...' : ''}"`,
          category: 'Admin',
          priority: 'medium',
          module_name: 'FEEDBACK_SUPPORT',
          record_id: feedback.id,
          action_url: '/admin/feedback-support'
        }
      );
    } catch (notifErr) {
      console.warn('Feedback notification dispatch warning:', notifErr.message);
    }

    // 2. Real-time Socket.io push to Staff & Admins
    try {
      const socketPayload = {
        type: 'FEEDBACK_SUBMITTED',
        title: `Feedback Received: ${userName} (${userRole})`,
        message: `${payload.subject} - Rating: ${payload.rating}/5`,
        data: feedback,
        created_at: new Date().toISOString()
      };
      socketService.emitToRole('admin', 'notification', socketPayload);
      socketService.emitToRole('manager', 'notification', socketPayload);
      socketService.broadcastLiveNotification(socketPayload);
    } catch (sockErr) {
      console.warn('Feedback socket dispatch warning:', sockErr.message);
    }

    return feedback;
  }

  async listFeedbacks(query) {
    return repository.listFeedbacks(query);
  }

  async getFeedbackStats() {
    return repository.getFeedbackStats();
  }

  async acceptFeedback(id, adminNotes = '', adminResponse = '', adminUser = null) {
    const feedback = await repository.getFeedbackById(id);
    const updated = await repository.updateFeedbackStatus(id, {
      status: 'ACCEPTED',
      admin_notes: adminNotes || 'Feedback reviewed and accepted by administration.',
      admin_response: adminResponse || 'Thank you! Your feedback has been officially reviewed and accepted by our system administrators.',
      responder_id: adminUser?.id || 1,
      responder_name: adminUser?.name || 'System Administrator'
    });

    // Notify original submitter that feedback was accepted!
    if (updated) {
      const targetUserId = updated.user_id || feedback?.user_id;
      const targetEmail = updated.user_email || feedback?.user_email;

      try {
        await notificationService.dispatchBusinessNotification(
          'FEEDBACK_ACCEPTED',
          targetUserId,
          {
            title: `Feedback Accepted: ${updated.subject}`,
            message: adminResponse || 'Your feedback has been accepted by the system administrator. Thank you for helping us improve!',
            category: 'General',
            priority: 'low',
            module_name: 'FEEDBACK_SUPPORT',
            record_id: updated.id,
            action_url: '/feedback-support',
            email: targetEmail
          },
          targetEmail
        );
      } catch (err) {
        console.warn('Feedback accepted notification warning:', err.message);
      }

      try {
        const notifPayload = {
          type: 'FEEDBACK_ACCEPTED',
          title: `Feedback Accepted: ${updated.subject}`,
          message: updated.admin_response,
          data: updated,
          created_at: new Date().toISOString()
        };
        if (targetUserId) {
          socketService.sendToUser(targetUserId, 'notification', notifPayload);
        }
        if (targetEmail) {
          socketService.emitToRoom(`email_${targetEmail}`, 'notification', notifPayload);
        }
        socketService.broadcastLiveNotification(notifPayload);
      } catch (err) {
        console.warn('Feedback accepted socket warning:', err.message);
      }
    }

    return updated;
  }

  async updateFeedbackStatus(id, { status, admin_notes, admin_response }, adminUser = null) {
    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'RESOLVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await repository.updateFeedbackStatus(id, {
      status,
      admin_notes,
      admin_response,
      responder_id: adminUser?.id || 1,
      responder_name: adminUser?.name || 'System Administrator'
    });

    if (updated) {
      try {
        const targetUserId = updated.user_id;
        const notifPayload = {
          type: 'FEEDBACK_STATUS_UPDATED',
          title: `Feedback Status: ${status}`,
          message: admin_response || `Feedback #${id} updated to status ${status}.`,
          data: updated,
          created_at: new Date().toISOString()
        };
        if (targetUserId) socketService.sendToUser(targetUserId, 'notification', notifPayload);
        socketService.broadcastLiveNotification(notifPayload);
      } catch (e) {}
    }

    return updated;
  }

  async createTicket(data, currentUser = null) {
    if (!data.subject || !data.description) {
      throw new Error('Subject and detailed description are required.');
    }

    const userId = currentUser?.id || data.user_id || null;
    const dbUser = await this._resolveUserDetails(userId);

    const userName = data.user_name || dbUser?.name || currentUser?.name || currentUser?.username || 'System User';
    const userEmail = data.user_email || dbUser?.email || currentUser?.email || 'user@vms.com';
    const userRole = (data.role_name || dbUser?.role || currentUser?.role || 'USER').toUpperCase();
    const userCode = data.user_code || dbUser?.user_code || (userId ? `${userRole.slice(0, 3)}${String(userId).padStart(6, '0')}` : null);
    const avatarUrl = data.avatar_url || dbUser?.avatar_url || currentUser?.avatar_url || null;
    const phoneNumber = data.phone_number || dbUser?.phone_number || currentUser?.phone_number || null;
    const departmentName = data.department_name || dbUser?.department_name || currentUser?.department_name || null;

    const payload = {
      user_id: userId,
      user_code: userCode,
      avatar_url: avatarUrl,
      phone_number: phoneNumber,
      user_name: userName,
      user_email: userEmail,
      role_name: userRole,
      department_name: departmentName,
      category: data.category || 'GENERAL_SUPPORT',
      priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'].includes(data.priority) ? data.priority : 'MEDIUM',
      subject: String(data.subject).trim(),
      description: String(data.description).trim()
    };

    const ticket = await repository.createTicket(payload);

    // Dispatch Ticket notification
    try {
      await notificationService.dispatchBusinessNotification(
        'SUPPORT_TICKET_CREATED',
        null,
        {
          title: `Support Ticket #${ticket.ticket_number} [${ticket.priority}]`,
          message: `${userName} (${userRole}): ${ticket.subject}`,
          category: 'Support',
          priority: ticket.priority === 'CRITICAL' || ticket.priority === 'URGENT' ? 'urgent' : 'medium',
          module_name: 'FEEDBACK_SUPPORT',
          record_id: ticket.id,
          action_url: `/admin/feedback-support?ticketId=${ticket.id}`
        }
      );
    } catch (e) {}

    try {
      const socketPayload = {
        type: 'SUPPORT_TICKET_CREATED',
        title: `New Ticket #${ticket.ticket_number}`,
        message: `${userName} opened a ${ticket.priority} priority ticket: ${ticket.subject}`,
        data: ticket,
        created_at: new Date().toISOString()
      };
      socketService.emitToRole('admin', 'notification', socketPayload);
      socketService.broadcastLiveNotification(socketPayload);
    } catch (e) {}

    return ticket;
  }

  async listTickets(query) {
    return repository.listTickets(query);
  }

  async getTicketById(id) {
    return repository.getTicketById(id);
  }

  async getTicketStats() {
    return repository.getTicketStats();
  }

  async addTicketMessage(ticketId, messageText, currentUser = null, isInternal = false) {
    if (!messageText || !messageText.trim()) {
      throw new Error('Message text cannot be empty.');
    }

    const updated = await repository.addTicketMessage(ticketId, {
      sender_id: currentUser?.id || null,
      sender_name: currentUser?.name || currentUser?.username || 'Support Responder',
      sender_role: (currentUser?.role || 'USER').toUpperCase(),
      message: messageText.trim(),
      is_internal_note: Boolean(isInternal)
    });

    if (updated) {
      try {
        const notifPayload = {
          type: 'TICKET_REPLY',
          title: `Ticket Reply #${updated.ticket_number}`,
          message: `${currentUser?.name || 'Staff'}: ${messageText.trim().substring(0, 80)}...`,
          data: updated,
          created_at: new Date().toISOString()
        };
        if (updated.user_id) socketService.sendToUser(updated.user_id, 'notification', notifPayload);
        socketService.broadcastLiveNotification(notifPayload);
      } catch (e) {}
    }

    return updated;
  }

  async updateTicketStatus(id, { status, assigned_to_name, resolution_notes }) {
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid ticket status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await repository.updateTicketStatus(id, {
      status,
      assigned_to_name,
      resolution_notes
    });

    if (updated) {
      try {
        const notifPayload = {
          type: 'TICKET_STATUS_UPDATED',
          title: `Ticket #${updated.ticket_number} is now ${status}`,
          message: resolution_notes || `Ticket status has been set to ${status}.`,
          data: updated,
          created_at: new Date().toISOString()
        };
        if (updated.user_id) socketService.sendToUser(updated.user_id, 'notification', notifPayload);
        socketService.broadcastLiveNotification(notifPayload);
      } catch (e) {}
    }

    return updated;
  }
}

module.exports = new FeedbackSupportService();

module.exports = new FeedbackSupportService();
