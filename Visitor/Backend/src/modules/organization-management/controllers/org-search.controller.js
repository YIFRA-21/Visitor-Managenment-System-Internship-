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
      const code = req.query.code || req.query.orgCode || req.query.org_code || req.query.c;

      if (!code || !String(code).trim()) {
        return res.status(200).json({
          success: true,
          code: '',
          taken: false,
          message: 'Organization code is available.',
        });
      }

      const cleanCode = String(code).trim().toUpperCase();
      const taken = await searchService.isCodeTaken(cleanCode, req.query.excludeId);

      res.status(200).json({
        success: true,
        code: cleanCode,
        taken,
        message: taken
          ? `Organization code '${cleanCode}' is already in use.`
          : `Organization code '${cleanCode}' is available.`,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrganizationSearchController();
