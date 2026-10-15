const visitorService = require('../services/visitor.service');

class VisitorController {
  async register(req, res, next) {
    try {
      const operatorUserId = req.user ? req.user.id : null;
      const visitor = await visitorService.registerVisitor(req.body, operatorUserId);
      res.status(201).json({
        status: 'success',
        message: 'Visitor profile registered successfully',
        data: visitor,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req, res, next) {
    try {
      const { id } = req.params;
      const profile = await visitorService.getVisitorProfile(id);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { id } = req.params;
      const history = await visitorService.getVisitorHistory(id);
      res.status(200).json(history);
    } catch (err) {
      next(err);
    }
  }

  async blacklist(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: 'Reason for blacklisting is required' });
      }
      await visitorService.blacklistVisitor(id, reason, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Visitor has been blacklisted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const visitors = await visitorService.listVisitors(req.query);
      res.status(200).json(visitors);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VisitorController();
