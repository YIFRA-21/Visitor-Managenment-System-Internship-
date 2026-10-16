const securityService = require('../services/security.service');

class SecurityController {
  async getDashboard(req, res, next) {
    try {
      const data = await securityService.getDashboard(req.user?.organizationId);
      res.json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async getWatchlist(req, res, next) {
    try {
      const data = await securityService.getWatchlist();
      res.json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async addToWatchlist(req, res, next) {
    try {
      const result = await securityService.addToWatchlist(req.body, req.user?.id || 1);
      res.status(201).json({ status: 'success', message: 'Added to watchlist', data: result });
    } catch (err) { next(err); }
  }

  async removeFromWatchlist(req, res, next) {
    try {
      await securityService.removeFromWatchlist(req.params.id, req.user?.id || 1);
      res.json({ status: 'success', message: 'Removed from watchlist' });
    } catch (err) { next(err); }
  }

  async getIncidents(req, res, next) {
    try {
      const { status } = req.query;
      const data = await securityService.getIncidents(status);
      res.json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async reportIncident(req, res, next) {
    try {
      const result = await securityService.reportIncident(req.body, req.user?.id || 1);
      res.status(201).json({ status: 'success', message: 'Security incident reported', data: result });
    } catch (err) { next(err); }
  }

  async updateIncident(req, res, next) {
    try {
      const { status, state, notes, resolution_notes, resolutionNotes, action_taken, actionTaken, severity, location, title, incident_title } = req.body;
      const finalStatus = status || state;
      const finalNotes = notes || resolution_notes || resolutionNotes || action_taken || actionTaken || null;
      const updatePayload = {
        status: finalStatus,
        notes: finalNotes,
        severity,
        location,
        title: title || incident_title,
        actionTaken: action_taken || actionTaken
      };
      const result = await securityService.updateIncident(req.params.id, updatePayload, req.user?.id || 1);
      res.json({ status: 'success', message: 'Incident updated successfully', data: result });
    } catch (err) { next(err); }
  }

  async getAccessRules(req, res, next) {
    try {
      const data = await securityService.getAccessRules();
      res.json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async getEscorts(req, res, next) {
    try {
      const data = await securityService.getEscorts();
      res.json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async assignEscort(req, res, next) {
    try {
      const result = await securityService.assignEscort(req.body, req.user?.id || 1);
      res.status(201).json({ status: 'success', message: 'Escort assigned successfully', data: result });
    } catch (err) { next(err); }
  }

  async getAnalytics(req, res, next) {
    try {
      const { dateFrom, dateTo } = req.query;
      const data = await securityService.getAnalytics(dateFrom, dateTo);
      res.json({ status: 'success', data });
    } catch (err) { next(err); }
  }
}

module.exports = new SecurityController();
