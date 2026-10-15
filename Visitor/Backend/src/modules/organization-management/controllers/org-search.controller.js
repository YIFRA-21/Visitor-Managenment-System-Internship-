const searchService = require('../services/org-search.service');

class OrganizationSearchController {
  /**
   * GET /api/organizations/search
   * Multi-field search with pagination and sorting.
   */
  async search(req, res, next) {
    try {
      const {
        name, code, registrationNumber, status, type,
        dateFrom, dateTo,
        page, limit, sortBy, sortOrder,
      } = req.query;

      const result = await searchService.searchOrganizations(
        { name, code, registrationNumber, status, type, dateFrom, dateTo },
        page, limit, sortBy, sortOrder
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/organizations/check-code?code=XXX&excludeId=N
   * Check if an organization code is already in use.
   */
  async checkCode(req, res, next) {
    try {
      const { code, excludeId } = req.query;

      if (!code || !code.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Organization code is required.',
        });
      }

      const taken = await searchService.isCodeTaken(code.trim(), excludeId);

      res.status(200).json({
        success: true,
        taken,
        message: taken
          ? `Organization code '${code.trim()}' is already in use.`
          : `Organization code '${code.trim()}' is available.`,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrganizationSearchController();
