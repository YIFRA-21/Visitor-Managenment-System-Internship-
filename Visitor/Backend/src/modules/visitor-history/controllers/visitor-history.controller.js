const visitorHistoryService = require('../services/visitor-history.service');

class VisitorHistoryController {
  async getHistoryList(req, res, next) {
    try {
      const result = await visitorHistoryService.getVisitorHistory(req.query);
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistoryStats(req, res, next) {
    try {
      const stats = await visitorHistoryService.getHistoryStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistoryDetails(req, res, next) {
    try {
      const { id } = req.params;
      const history = await visitorHistoryService.getHistoryDetails(id);
      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  async updateHistoryMetadata(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await visitorHistoryService.updateHistoryMetadata(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Visitor history record updated successfully.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteHistory(req, res, next) {
    try {
      const { id } = req.params;
      await visitorHistoryService.softDeleteHistory(id);
      return res.status(200).json({
        success: true,
        message: 'Visitor history record deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VisitorHistoryController();
