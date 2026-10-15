const NotificationComposerService = require('../services/notification-composer.service');

class NotificationComposerController {
  // POST /api/manual-composer/compose
  async compose(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;
      const result = await NotificationComposerService.compose(req.body, userId);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: 'Failed to compose notification' });
    }
  }

  // GET /api/manual-composer/drafts
  async getDrafts(req, res) {
    try {
      const drafts = await NotificationComposerService.getDraftVersions(req.query.id || 1);
      res.json({ success: true, data: drafts });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch drafts' });
    }
  }

  // GET /api/manual-composer/schedules
  async getSchedules(req, res) {
    try {
      const schedules = await NotificationComposerService.getSchedules();
      res.json({ success: true, data: schedules });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  }

  // GET /api/manual-composer/broadcasts
  async getBroadcasts(req, res) {
    try {
      const broadcasts = await NotificationComposerService.getBroadcasts();
      res.json({ success: true, data: broadcasts });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch broadcasts' });
    }
  }

  // GET /api/manual-composer/delivery
  async getDeliveryTracking(req, res) {
    try {
      const tracking = await NotificationComposerService.getDeliveryTracking(req.query.id || 5001);
      res.json({ success: true, data: tracking });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch delivery tracking' });
    }
  }

  // POST /api/manual-composer/retry/:id
  async retryDelivery(req, res) {
    try {
      const result = await NotificationComposerService.retryDelivery(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: 'Failed to trigger retry' });
    }
  }

  // GET /api/manual-composer/queues
  async getQueues(req, res) {
    try {
      const queues = await NotificationComposerService.getQueueStatus();
      res.json({ success: true, data: queues });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch queue metrics' });
    }
  }
}

module.exports = new NotificationComposerController();
