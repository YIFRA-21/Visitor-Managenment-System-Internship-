const MessageService = require('../services/message.service');

class MessageController {
  // Get Threads List
  async getThreads(req, res) {
    try {
      const visitorId = req.user?.id;
      const threads = await MessageService.getVisitorThreads(visitorId);
      res.json(threads);
    } catch (err) {
      console.error('getThreads error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch conversation threads' });
    }
  }

  // Create Thread / Initial Message
  async createThread(req, res) {
    try {
      const visitorId = req.user?.id;
      const data = req.body;

      const result = await MessageService.createThread(visitorId, data);
      res.json(result);
    } catch (err) {
      console.error('createThread error:', err);
      res.status(400).json({ error: err.message || 'Failed to create conversation thread' });
    }
  }

  // Get Messages for Thread
  async getThreadMessages(req, res) {
    try {
      const { threadId } = req.params;
      const userId = req.user?.id;

      const result = await MessageService.getThreadMessages(threadId, userId);
      res.json(result);
    } catch (err) {
      console.error('getThreadMessages error:', err);
      res.status(400).json({ error: err.message || 'Failed to fetch messages' });
    }
  }

  // Send Reply Message
  async sendMessage(req, res) {
    try {
      const { threadId } = req.params;
      const senderId = req.user?.id;
      const senderRole = req.user?.role || 'visitor';
      const { body, attachments } = req.body;

      const result = await MessageService.sendMessage(threadId, senderId, senderRole, body, attachments);
      res.json(result);
    } catch (err) {
      console.error('sendMessage error:', err);
      res.status(400).json({ error: err.message || 'Failed to send message' });
    }
  }

  // Get Authorized Contacts
  async getAuthorizedContacts(req, res) {
    try {
      const visitorId = req.user?.id;
      const contacts = await MessageService.getAuthorizedContacts(visitorId);
      res.json(contacts);
    } catch (err) {
      console.error('getAuthorizedContacts error:', err);
      res.status(500).json({ error: 'Failed to fetch authorized contacts' });
    }
  }
}

module.exports = new MessageController();
