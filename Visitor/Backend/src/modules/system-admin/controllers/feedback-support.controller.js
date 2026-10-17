const service = require('../services/feedback-support.service');

class FeedbackSupportController {
  async submitFeedback(req, res, next) {
    try {
      const feedback = await service.submitFeedback(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully. Thank you for helping us improve!',
        data: feedback
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async listFeedbacks(req, res, next) {
    try {
      const result = await service.listFeedbacks(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getFeedbackStats(req, res, next) {
    try {
      const stats = await service.getFeedbackStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async acceptFeedback(req, res, next) {
    try {
      const { id } = req.params;
      const { admin_notes, admin_response } = req.body;
      const updated = await service.acceptFeedback(id, admin_notes, admin_response, req.user);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Feedback not found.' });
      }
      res.json({
        success: true,
        message: 'Feedback accepted and official acknowledgment recorded.',
        data: updated
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateFeedbackStatus(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await service.updateFeedbackStatus(id, req.body, req.user);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Feedback not found.' });
      }
      res.json({ success: true, message: 'Feedback status updated.', data: updated });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ─── Support Tickets ───────────────────────────────────────────────────────
  async createTicket(req, res, next) {
    try {
      const ticket = await service.createTicket(req.body, req.user);
      res.status(201).json({
        success: true,
        message: `Support ticket #${ticket.ticket_number} created successfully. Our team will assist you shortly.`,
        data: ticket
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async listTickets(req, res, next) {
    try {
      const result = await service.listTickets(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getTicket(req, res, next) {
    try {
      const ticket = await service.getTicketById(req.params.id);
      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found.' });
      }
      res.json({ success: true, data: ticket });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getTicketStats(req, res, next) {
    try {
      const stats = await service.getTicketStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async addTicketMessage(req, res, next) {
    try {
      const { id } = req.params;
      const body = req.body || {};
      const message = body.message || body.text || body.content || body.body || body.comment || 'Support message recorded.';
      const isInternal = body.is_internal_note || body.isInternal || false;
      const updated = await service.addTicketMessage(id, message, req.user, isInternal);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Ticket not found.' });
      }
      res.json({ success: true, message: 'Message sent.', data: updated });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateTicketStatus(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await service.updateTicketStatus(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Ticket not found.' });
      }
      res.json({ success: true, message: 'Ticket status updated.', data: updated });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new FeedbackSupportController();
