const reportService = require('../services/report.service');

class ReportController {
  async getDashboard(req, res, next) {
    try {
      const data = await reportService.getDashboard();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getDaily(req, res, next) {
    try {
      const { date } = req.query;
      const data = await reportService.getDailyVisitors(date);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getMonthly(req, res, next) {
    try {
      const { month, year } = req.query;
      const data = await reportService.getMonthlyVisitors(
        month ? parseInt(month) : null,
        year ? parseInt(year) : null
      );
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getEmployeeStats(req, res, next) {
    try {
      const data = await reportService.getEmployeeVisitorStats();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getSecurity(req, res, next) {
    try {
      const result = await reportService.getSecurityReport(req.query);
      res.status(200).json({ status: 'success', data: result.events, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const result = await reportService.getAuditLogsReport(req.query);
      res.status(200).json({ status: 'success', data: result.logs, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async getVisitors(req, res, next) {
    try {
      const result = await reportService.getVisitorsReport(req.query);
      res.status(200).json({ status: 'success', data: result.visitors, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async getCheckinLogs(req, res, next) {
    try {
      const result = await reportService.getCheckinLogsReport(req.query);
      res.status(200).json({ status: 'success', data: result.checkins, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  async getPeakHours(req, res, next) {
    try {
      const data = await reportService.getPeakHours();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const data = await reportService.getVisitorHistory(req.query);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getKPIs(req, res, next) {
    try {
      const data = await reportService.getKPIs();
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async getDepartments(req, res, next) {
    try {
      const data = await reportService.getDepartmentPerformance();
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async getOccupancy(req, res, next) {
    try {
      const { dateFrom, dateTo } = req.query;
      const data = await reportService.getOccupancyAnalytics(dateFrom, dateTo);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async getSaved(req, res, next) {
    try {
      const data = await reportService.getSavedReports();
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async saveCustom(req, res, next) {
    try {
      const data = await reportService.saveCustomReport(req.body, req.user.id);
      res.status(201).json({ status: 'success', message: 'Report definition saved', data });
    } catch (err) { next(err); }
  }
}

module.exports = new ReportController();
