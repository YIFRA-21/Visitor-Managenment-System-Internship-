/**
 * Enterprise Communication Controller
 * ───────────────────────────────────────
 * REST API controller for Message Center, System Chat, Role Contacts,
 * Real SMTP Email, Administrator Announcements, and Unread Counters.
 */

const communicationService = require('../services/communication.service');

class CommunicationController {
  // ── Contacts ────────────────────────────────────────────────────────────
  async getContacts(req, res, next) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const result = await communicationService.getAvailableContacts(userId, role);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── System Chat Conversations ───────────────────────────────────────────
  async getConversations(req, res, next) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const result = await communicationService.getUserConversations(userId, role);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createDirectConversation(req, res, next) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ error: 'targetUserId is required' });
      }
      const result = await communicationService.createOrGetDirectConversation(userId, role, Number(targetUserId));
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createGroupConversation(req, res, next) {
    try {
      const userId = req.user?.id;
      const { title, participantUserIds = [], description } = req.body;
      const result = await communicationService.createGroupConversation(userId, title, participantUserIds, description);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateConversation(req, res, next) {
    try {
      const { convId } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;
      const result = await communicationService.updateConversation(Number(convId), userId, role, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async deleteConversation(req, res, next) {
    try {
      const { convId } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;
      const result = await communicationService.deleteConversation(Number(convId), userId, role);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async addParticipant(req, res, next) {
    try {
      const { convId } = req.params;
      const { userId } = req.body;
      const result = await communicationService.addParticipantToConversation(Number(convId), Number(userId));
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async removeParticipant(req, res, next) {
    try {
      const { convId, userId } = req.params;
      const result = await communicationService.removeParticipantFromConversation(Number(convId), Number(userId));
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async addManualContact(req, res, next) {
    try {
      const userId = req.user?.id;
      const result = await communicationService.createManualContact(userId, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── Chat Messages ───────────────────────────────────────────────────────
  async getChatMessages(req, res, next) {
    try {
      const { convId } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;
      const result = await communicationService.getChatMessages(Number(convId), userId, role);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async sendChatMessage(req, res, next) {
    try {
      const { convId } = req.params;
      const senderId = req.user?.id;
      const role = req.user?.role;
      const { message_text, message_type = 'text', attachments } = req.body;
      const result = await communicationService.sendChatMessage(
        Number(convId),
        senderId,
        role,
        message_text,
        message_type,
        attachments
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async editChatMessage(req, res, next) {
    try {
      const { convId, messageId } = req.params;
      const userId = req.user?.id;
      const { message_text } = req.body;
      const result = await communicationService.editChatMessage(
        Number(convId),
        Number(messageId),
        userId,
        message_text
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async deleteChatMessage(req, res, next) {
    try {
      const { convId, messageId } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;
      const result = await communicationService.deleteChatMessage(
        convId ? Number(convId) : 0,
        Number(messageId),
        userId,
        role
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async deleteChatMessageAttachment(req, res, next) {
    try {
      const { convId, messageId } = req.params;
      const { attachmentUrl } = req.body || req.query;
      const userId = req.user?.id;
      const role = req.user?.role;
      const result = await communicationService.deleteChatMessageAttachment(
        convId ? Number(convId) : 0,
        Number(messageId),
        attachmentUrl,
        userId,
        role
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── Real Email Dispatch ─────────────────────────────────────────────────
  async sendDirectEmail(req, res, next) {
    try {
      const senderId = req.user?.id;
      const result = await communicationService.sendDirectEmail(senderId, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── Announcements (Admin-Only for creation) ─────────────────────────────
  async getAnnouncements(req, res, next) {
    try {
      const role = req.user?.role;
      const orgId = req.user?.organizationId;
      const result = await communicationService.getAnnouncements(role, orgId, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createAnnouncement(req, res, next) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const result = await communicationService.createAnnouncement(userId, role, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async markAnnouncementRead(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const result = await communicationService.markAnnouncementRead(Number(id), userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateAnnouncement(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;
      const result = await communicationService.updateAnnouncement(Number(id), userId, role, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async deleteAnnouncement(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;
      const result = await communicationService.deleteAnnouncement(Number(id), userId, role);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // ── Centralized Real Unread Counts ──────────────────────────────────────
  async getUnreadCounts(req, res, next) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const email = req.user?.email || '';
      const result = await communicationService.getUnreadCounts(userId, role, email);
      res.json(result);
    } catch (err) {
      console.warn('getUnreadCounts safe fallback warning:', err.message);
      res.json({ success: true, unread_notifications: 0, unread_messages: 0 });
    }
  }

  // ── Upload Attachment (Media/Documents) ──────────────────────────────────
  async uploadAttachment(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      const fileUrl = `/uploads/${file.filename}`;
      
      let type = 'file';
      if (file.mimetype.startsWith('image/')) type = 'image';
      else if (file.mimetype.startsWith('video/')) type = 'video';
      else if (file.mimetype.includes('pdf') || file.mimetype.includes('word') || file.mimetype.includes('text')) type = 'document';

      res.status(201).json({
        success: true,
        attachment: {
          name: file.originalname,
          filename: file.filename,
          url: fileUrl,
          size: file.size,
          mimetype: file.mimetype,
          type
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CommunicationController();
