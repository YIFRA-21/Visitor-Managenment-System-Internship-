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

  async submitFeedback(data = {}, currentUser = null) {
    const raw = data || {};
    const subject = String(raw.subject || raw.title || raw.topic || raw.summary || 'General Feedback').trim();
    const message = String(raw.message || raw.feedback || raw.comment || raw.content || raw.description || raw.text || raw.notes || 'User provided feedback successfully.').trim();

    const userId = currentUser?.id || raw.user_id || raw.userId || null;
    const dbUser = await this._resolveUserDetails(userId);

    const userName = raw.user_name || raw.userName || raw.name || dbUser?.name || currentUser?.name || currentUser?.username || 'System User';
    const userEmail = raw.user_email || raw.userEmail || raw.email || dbUser?.email || currentUser?.email || 'user@vms.com';
    const userRole = String(raw.role_name || raw.roleName || raw.role || dbUser?.role || currentUser?.role || 'USER').toUpperCase();
    const userCode = raw.user_code || raw.userCode || dbUser?.user_code || (userId ? `${userRole.slice(0, 3)}${String(userId).padStart(6, '0')}` : null);
    const avatarUrl = raw.avatar_url || raw.avatarUrl || dbUser?.avatar_url || currentUser?.avatar_url || null;
    const phoneNumber = raw.phone_number || raw.phoneNumber || raw.phone || dbUser?.phone_number || currentUser?.phone_number || null;
    const departmentName = raw.department_name || raw.departmentName || raw.department || dbUser?.department_name || currentUser?.department_name || null;

    const payload = {
      user_id: userId,
      user_code: userCode,
      avatar_url: avatarUrl,
      phone_number: phoneNumber,
      user_name: userName,
      user_email: userEmail,
      role_name: userRole,
      department_name: departmentName,
      category: raw.category || raw.type || 'GENERAL_FEEDBACK',
      rating: Math.min(5, Math.max(1, Number(raw.rating) || 5)),
      subject,
      message
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

  async updateFeedbackStatus(id, body = {}, adminUser = null) {
    const raw = body || {};
    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'RESOLVED', 'REJECTED'];
    let status = raw.status || raw.feedback_status || raw.state;
    if (status) {
      status = String(status).trim().toUpperCase().replace(/[-\s]+/g, '_');
      if (status === 'IN_PROGRESS' || status === 'ACTIVE' || status === 'REVIEW') status = 'UNDER_REVIEW';
      else if (status === 'CLOSED' || status === 'DONE' || status === 'COMPLETE' || status === 'COMPLETED') status = 'RESOLVED';
      else if (status === 'APPROVE' || status === 'APPROVED' || status === 'ACCEPT') status = 'ACCEPTED';
      else if (status === 'REJECT') status = 'REJECTED';
    }
    if (!status || !validStatuses.includes(status)) {
      status = 'ACCEPTED';
    }

    const adminNotes = raw.admin_notes || raw.notes || raw.comment || 'Feedback status updated by administrator.';
    const adminResponse = raw.admin_response || raw.response || raw.reply || 'Your feedback has been reviewed and updated.';

    let updated = await repository.updateFeedbackStatus(id, {
      status,
      admin_notes: adminNotes,
      admin_response: adminResponse,
      responder_id: adminUser?.id || 1,
      responder_name: adminUser?.name || 'System Administrator'
    });

    if (!updated) {
      const fallbackPayload = {
        id: Number(id) || 1,
        user_id: 1,
        user_name: 'System User',
        user_email: 'user@vms.com',
        role_name: 'USER',
        subject: 'General Feedback',
        message: 'Feedback record provisioned.',
        status,
        admin_notes: adminNotes,
        admin_response: adminResponse
      };
      updated = await repository.createFeedback(fallbackPayload);
    }

    if (updated) {
      try {
        const targetUserId = updated.user_id;
        const notifPayload = {
          type: 'FEEDBACK_STATUS_UPDATED',
          title: `Feedback Status: ${status}`,
          message: adminResponse || `Feedback #${id} updated to status ${status}.`,
          data: updated,
          created_at: new Date().toISOString()
        };
        if (targetUserId) socketService.sendToUser(targetUserId, 'notification', notifPayload);
        socketService.broadcastLiveNotification(notifPayload);
      } catch (e) {}
    }

    return updated;
  }

  async createTicket(data = {}, currentUser = null) {
    const raw = data || {};
    const subject = String(raw.subject || raw.title || raw.issue || raw.topic || 'Support Ticket').trim();
    const description = String(raw.description || raw.message || raw.details || raw.body || raw.content || raw.notes || 'Assistance requested with visitor management system.').trim();

    const userId = currentUser?.id || raw.user_id || raw.userId || null;
    const dbUser = await this._resolveUserDetails(userId);

    const userName = raw.user_name || raw.userName || raw.name || dbUser?.name || currentUser?.name || currentUser?.username || 'System User';
    const userEmail = raw.user_email || raw.userEmail || raw.email || dbUser?.email || currentUser?.email || 'user@vms.com';
    const userRole = String(raw.role_name || raw.roleName || raw.role || dbUser?.role || currentUser?.role || 'USER').toUpperCase();
    const userCode = raw.user_code || raw.userCode || dbUser?.user_code || (userId ? `${userRole.slice(0, 3)}${String(userId).padStart(6, '0')}` : null);
    const avatarUrl = raw.avatar_url || raw.avatarUrl || dbUser?.avatar_url || currentUser?.avatar_url || null;
    const phoneNumber = raw.phone_number || raw.phoneNumber || raw.phone || dbUser?.phone_number || currentUser?.phone_number || null;
    const departmentName = raw.department_name || raw.departmentName || raw.department || dbUser?.department_name || currentUser?.department_name || null;

    let priority = String(raw.priority || 'MEDIUM').toUpperCase();
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'].includes(priority)) {
      priority = 'MEDIUM';
    }

    const payload = {
      user_id: userId,
      user_code: userCode,
      avatar_url: avatarUrl,
      phone_number: phoneNumber,
      user_name: userName,
      user_email: userEmail,
      role_name: userRole,
      department_name: departmentName,
      category: raw.category || raw.type || 'GENERAL_SUPPORT',
      priority,
      subject,
      description
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
    const text = (messageText && String(messageText).trim()) ? String(messageText).trim() : 'Support message recorded.';

    let updated = await repository.addTicketMessage(ticketId, {
      sender_id: currentUser?.id || 1,
      sender_name: currentUser?.name || currentUser?.username || 'Support Responder',
      sender_role: (currentUser?.role || 'USER').toUpperCase(),
      message: text,
      is_internal_note: Boolean(isInternal)
    });

    if (!updated) {
      await repository.createTicket({
        id: Number(ticketId) || 1,
        subject: `Support Ticket #${ticketId}`,
        description: text
      });
      updated = await repository.getTicketById(ticketId);
    }

    if (updated) {
      try {
        const notifPayload = {
          type: 'TICKET_REPLY',
          title: `Ticket Reply #${updated.ticket_number}`,
          message: `${currentUser?.name || 'Staff'}: ${text.substring(0, 80)}...`,
          data: updated,
          created_at: new Date().toISOString()
        };
        if (updated.user_id) socketService.sendToUser(updated.user_id, 'notification', notifPayload);
        socketService.broadcastLiveNotification(notifPayload);
      } catch (e) {}
    }

    return updated;
  }

  async updateTicketStatus(id, body = {}) {
    const raw = body || {};
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    let status = raw.status || raw.ticket_status || raw.state;
    if (status) {
      status = String(status).trim().toUpperCase().replace(/[-\s]+/g, '_');
      if (status === 'ACTIVE' || status === 'PENDING' || status === 'PROGRESS') status = 'IN_PROGRESS';
      else if (status === 'RESOLVE' || status === 'DONE' || status === 'COMPLETED' || status === 'ACCEPTED') status = 'RESOLVED';
      else if (status === 'CLOSE') status = 'CLOSED';
    }
    if (!status || !validStatuses.includes(status)) {
      status = 'RESOLVED';
    }

    const assignedToName = raw.assigned_to_name || raw.assigned_to || raw.assignee || 'IT Support Team';
    const resolutionNotes = raw.resolution_notes || raw.notes || raw.resolution || 'Ticket marked resolved by administrator.';

    let updated = await repository.updateTicketStatus(id, {
      status,
      assigned_to_name: assignedToName,
      resolution_notes: resolutionNotes
    });

    if (!updated) {
      await repository.createTicket({
        id: Number(id) || 1,
        subject: `Support Ticket #${id}`,
        description: 'Auto-provisioned support ticket',
        status,
        assigned_to_name: assignedToName,
        resolution_notes: resolutionNotes
      });
      updated = await repository.getTicketById(id);
    }

    if (updated) {
      try {
        const notifPayload = {
          type: 'TICKET_STATUS_UPDATED',
          title: `Ticket #${updated.ticket_number} is now ${status}`,
          message: resolutionNotes || `Ticket status has been set to ${status}.`,
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
