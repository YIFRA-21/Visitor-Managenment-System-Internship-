const searchService = require('../services/branch-search.service');

class BranchSearchController {
  async search(req, res, next) {
    try {
      const {
        name, code, organizationId, city, country, status, type,
        page, limit, sortBy, sortOrder
      } = req.query;

      const result = await searchService.searchBranches(
        { name, code, organizationId, city, country, status, type },
        page, limit, sortBy, sortOrder
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async checkCode(req, res, next) {
    try {
      const code = req.query.code || req.query.branchCode || req.query.branch_code || req.query.q || req.query.c;

      if (!code || !String(code).trim()) {
        return res.status(200).json({
          success: true,
          code: '',
          taken: false,
          message: 'Branch code is available.',
        });
      }

      const cleanCode = String(code).trim().toUpperCase();
      const taken = await searchService.isCodeTaken(cleanCode, req.query.excludeId);

      res.status(200).json({
        success: true,
        code: cleanCode,
        taken,
        message: taken
          ? `Branch code '${cleanCode}' is already in use.`
          : `Branch code '${cleanCode}' is available.`,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BranchSearchController();
