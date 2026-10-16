const checkoutService = require('../services/checkout.service');

class CheckoutController {
  async getDashboard(req, res, next) {
    try {
      const { date } = req.query;
      const data = await checkoutService.getDashboard(req.user?.organizationId, date);
      res.json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async getPending(req, res, next) {
    try {
      const { search } = req.query;
      const data = await checkoutService.getPending({ search });
      res.json({ status: 'success', data, total: data.length });
    } catch (err) { next(err); }
  }

  async getOverstay(req, res, next) {
    try {
      const data = await checkoutService.getOverstays();
      res.json({ status: 'success', data, total: data.length });
    } catch (err) { next(err); }
  }

  async getEvacuation(req, res, next) {
    try {
      const data = await checkoutService.getEvacuationRollCall();
      res.json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async processExit(req, res, next) {
    try {
      const { code, checkoutMethod, remarks, assets, passCondition } = req.body || {};
      const checkoutData = { checkoutMethod: checkoutMethod || 'MANUAL', remarks, assets, passCondition };
      const result = await checkoutService.processExit(code, checkoutData, req.user?.id || 1);
      res.json({ status: 'success', message: 'Visitor checked out successfully', data: result });
    } catch (err) { next(err); }
  }

  async processGroupExit(req, res, next) {
    try {
      const { codes, checkoutMethod, remarks } = req.body || {};
      const result = await checkoutService.processGroupExit(codes, { checkoutMethod: checkoutMethod || 'MANUAL', remarks }, req.user?.id || 1);
      res.json({ status: 'success', ...result });
    } catch (err) { next(err); }
  }

  async getHistory(req, res, next) {
    try {
      const { dateFrom, dateTo, checkoutMethod, search, page, limit } = req.query;
      const filters = { dateFrom, dateTo, checkoutMethod, search };
      const result = await checkoutService.getHistory(filters, { page, limit });
      res.json({ status: 'success', ...result });
    } catch (err) { next(err); }
  }

  async getAnalytics(req, res, next) {
    try {
      const { dateFrom, dateTo } = req.query;
      const data = await checkoutService.getAnalytics(dateFrom, dateTo);
      res.json({ status: 'success', data });
    } catch (err) { next(err); }
  }
}

module.exports = new CheckoutController();
