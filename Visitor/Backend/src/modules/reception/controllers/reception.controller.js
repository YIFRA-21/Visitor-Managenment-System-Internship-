const ReceptionService = require('../services/reception.service');

class ReceptionController {
  // 1. Dashboard
  async getDashboard(req, res) {
    try {
      const data = await ReceptionService.getDashboardStats();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch reception dashboard stats' });
    }
  }

  // 2. Arrivals
  async getArrivals(req, res) {
    try {
      const { search, filter } = req.query;
      const arrivals = await ReceptionService.getArrivals(search, filter);
      res.json(arrivals);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch arrival list' });
    }
  }

  async confirmArrival(req, res) {
    try {
      const { id } = req.params;
      const receptionistInfo = req.user || {};
      const result = await ReceptionService.confirmArrival(id, receptionistInfo);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message || 'Failed to confirm visitor arrival' });
    }
  }

  async cancelArrival(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const receptionistInfo = req.user || {};
      const result = await ReceptionService.cancelArrival(id, reason, receptionistInfo);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message || 'Failed to cancel arrival' });
    }
  }

  // 3. Appointment Verification
  async verifyAppointment(req, res) {
    try {
      const { query } = req.body;
      const result = await ReceptionService.verifyAppointment(query);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message || 'Appointment verification failed' });
    }
  }

  // 3b. Biometric Face Match
  async matchFace(req, res) {
    try {
      const { image, visitorId, appointmentNumber, code } = req.body;
      const result = await ReceptionService.matchFace(image, { visitorId, appointmentNumber, code });
      res.json(result);
    } catch (err) {
      console.error('Face match error in reception controller:', err);
      res.status(400).json({ error: err.message || 'Face recognition matching failed' });
    }
  }

  // 4. Walk-in Visitor Management
  async registerWalkIn(req, res) {
    try {
      const walkInData = req.body;
      const receptionistInfo = req.user || {};
      const result = await ReceptionService.registerWalkIn(walkInData, receptionistInfo);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message || 'Failed to register walk-in visitor' });
    }
  }

  // 5. Visitor Queue Management
  async getQueue(req, res) {
    try {
      const queue = await ReceptionService.getQueue();
      res.json(queue);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch visitor queue' });
    }
  }

  async updateQueueStatus(req, res) {
    try {
      const { id } = req.params;
      const actionData = req.body;
      const receptionistInfo = req.user || {};
      const result = await ReceptionService.updateQueueStatus(id, actionData, receptionistInfo);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message || 'Failed to update visitor queue' });
    }
  }

  // 6. Visitor Pass Issuance
  async generatePass(req, res) {
    try {
      const passData = req.body;
      const receptionistInfo = req.user || {};
      const result = await ReceptionService.generateVisitorPass(passData, receptionistInfo);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message || 'Failed to generate visitor pass' });
    }
  }

  // 7. Host Notification
  async sendHostNotification(req, res) {
    try {
      const notificationData = req.body;
      const receptionistInfo = req.user || {};
      const result = await ReceptionService.sendHostNotification(notificationData, receptionistInfo);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message || 'Failed to send host notification' });
    }
  }

  // 8. Waiting Area Management
  async getWaitingArea(req, res) {
    try {
      const waiting = await ReceptionService.getWaitingArea();
      res.json(waiting);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch waiting area list' });
    }
  }

  // 9. Reception Search & Directory
  async searchDirectory(req, res) {
    try {
      const { q } = req.query;
      const results = await ReceptionService.searchDirectory(q);
      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Directory search failed' });
    }
  }

  // 10. Reports
  async getReports(req, res) {
    try {
      const { type, startDate, endDate } = req.query;
      const report = await ReceptionService.getReports(type, startDate, endDate);
      res.json(report);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate reception report' });
    }
  }

  // 11. Activity Log
  async getActivityLogs(req, res) {
    try {
      const { limit } = req.query;
      const logs = await ReceptionService.getActivityLogs(limit || 50);
      res.json(logs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch reception activity logs' });
    }
  }

  // 12. Profile & Settings
  async getProfile(req, res) {
    try {
      const userId = req.user?.id || 6;
      const profile = await ReceptionService.getProfileAndSettings(userId);
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch reception profile' });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user?.id || 6;
      const settingsData = req.body;
      const result = await ReceptionService.updateProfileAndSettings(userId, settingsData);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: 'Failed to update reception profile' });
    }
  }
}

module.exports = new ReceptionController();
