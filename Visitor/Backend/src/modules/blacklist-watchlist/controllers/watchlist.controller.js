const service = require('../services/watchlist.service');

class BlacklistWatchlistController {
  async getDirectory(req, res, next) {
    try {
      const data = await service.getDirectory(req.query);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getRecordDetails(req, res, next) {
    try {
      const data = await service.getRecordDetails(req.params.id);
      if (!data) return res.status(404).json({ status: 'error', message: 'Record not found' });
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async createRecord(req, res, next) {
    try {
      const data = await service.createRecord(req.body, req.user.id);
      res.status(201).json({ status: 'success', message: 'Security record created', data });
    } catch (err) {
      next(err);
    }
  }

  async updateRecord(req, res, next) {
    try {
      const data = await service.updateRecord(req.params.id, req.body, req.user.id);
      res.status(200).json({ status: 'success', message: 'Security record updated', data });
    } catch (err) {
      next(err);
    }
  }

  async verifyVisitor(req, res, next) {
    try {
      const data = await service.verifyVisitor(req.body);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const data = await service.updateStatus(req.params.id, status, req.user.id);
      res.status(200).json({ status: 'success', message: 'Status updated', data });
    } catch (err) {
      next(err);
    }
  }

  async reviewClearance(req, res, next) {
    try {
      const { decision, notes } = req.body;
      const data = await service.reviewClearance(req.params.id, decision, notes, req.user.id);
      res.status(200).json({ status: 'success', message: 'Clearance decision recorded', data });
    } catch (err) {
      next(err);
    }
  }

  async archiveRecord(req, res, next) {
    try {
      const data = await service.archiveRecord(req.params.id, req.user.id);
      res.status(200).json({ status: 'success', message: 'Record archived', data });
    } catch (err) {
      next(err);
    }
  }

  async deleteRecord(req, res, next) {
    try {
      const data = await service.deleteRecord(req.params.id, req.user.id);
      res.status(200).json({ status: 'success', message: 'Record permanently deleted', data });
    } catch (err) {
      next(err);
    }
  }

  async restoreRecord(req, res, next) {
    try {
      const data = await service.restoreRecord(req.params.id, req.user.id);
      res.status(200).json({ status: 'success', message: 'Record restored', data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BlacklistWatchlistController();
