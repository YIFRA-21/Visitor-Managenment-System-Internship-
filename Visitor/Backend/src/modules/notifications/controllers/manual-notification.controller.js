const ManualNotificationService = require('../services/manual-notification.service');

class ManualNotificationController {
  // GET /api/manual-notifications/dashboard
  async getDashboard(req, res) {
    try {
      const [metrics, statistics, recent, drafts] = await Promise.all([
        ManualNotificationService.getDashboardMetrics(),
        ManualNotificationService.getStatistics(),
        ManualNotificationService.getRecentNotifications(10),
        ManualNotificationService.getDrafts()
      ]);

      res.json({
        success: true,
        data: { metrics, statistics, recentNotifications: recent, drafts }
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      res.status(500).json({ error: 'Failed to load notification dashboard' });
    }
  }

  // GET /api/manual-notifications/statistics
  async getStatistics(req, res) {
    try {
      const statistics = await ManualNotificationService.getStatistics();
      res.json({ success: true, data: statistics });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load statistics' });
    }
  }

  // GET /api/manual-notifications/recent
  async getRecent(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const recent = await ManualNotificationService.getRecentNotifications(limit);
      res.json({ success: true, data: recent });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load recent notifications' });
    }
  }

  // GET /api/manual-notifications/drafts
  async getDrafts(req, res) {
    try {
      const drafts = await ManualNotificationService.getDrafts();
      res.json({ success: true, data: drafts });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load drafts' });
    }
  }

  // POST /api/manual-notifications/dispatch
  async dispatch(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;
      const result = await ManualNotificationService.createNotification(req.body, userId);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      console.error('Dispatch error:', err);
      res.status(500).json({ error: 'Failed to dispatch notification' });
    }
  }

  // POST /api/manual-notifications/draft
  async saveDraft(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;
      const result = await ManualNotificationService.createNotification({ ...req.body, isDraft: true }, userId);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save draft' });
    }
  }

  // GET /api/manual-notifications/recipients/search
  async searchRecipients(req, res) {
    try {
      const { q, role, department_id, status } = req.query;
      const results = await ManualNotificationService.searchRecipients(q || '', { role, department_id, status });
      res.json({ success: true, data: results });
    } catch (err) {
      res.status(500).json({ error: 'Failed to search recipients' });
    }
  }

  // POST /api/manual-notifications/recipients/validate
  async validateRecipients(req, res) {
    try {
      const { recipientIds } = req.body;
      const results = await ManualNotificationService.validateRecipients(recipientIds || []);
      res.json({ success: true, data: results });
    } catch (err) {
      res.status(500).json({ error: 'Failed to validate recipients' });
    }
  }

  // GET /api/manual-notifications/channels
  async getChannels(req, res) {
    res.json({
      success: true,
      data: [
        { id: 'in_app', name: 'In-App Notification', icon: 'bell', enabled: true },
        { id: 'email', name: 'Email (SMTP)', icon: 'envelope', enabled: true },
        { id: 'sms', name: 'SMS Gateway', icon: 'phone', enabled: true },
        { id: 'browser', name: 'Browser Push', icon: 'globe', enabled: true },
        { id: 'desktop', name: 'Desktop Notification', icon: 'display', enabled: false }
      ]
    });
  }

  // POST /api/manual-notifications/preview
  async preview(req, res) {
    try {
      const { subject, body, channel, mergeVars } = req.body;
      let rendered = body || '';
      const vars = mergeVars || {};
      Object.keys(vars).forEach(key => {
        rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), vars[key]);
      });

      res.json({
        success: true,
        data: {
          channel: channel || 'in_app',
          subject: subject || '',
          renderedBody: rendered,
          estimatedDeliveryTime: '< 5 seconds'
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate preview' });
    }
  }
}

module.exports = new ManualNotificationController();
