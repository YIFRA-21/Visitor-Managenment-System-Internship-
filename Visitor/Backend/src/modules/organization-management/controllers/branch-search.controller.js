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
      const { code, excludeId } = req.query;

      if (!code || !code.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Branch code is required.',
        });
      }

      const taken = await searchService.isCodeTaken(code.trim(), excludeId);

      res.status(200).json({
        success: true,
        taken,
        message: taken
          ? `Branch code '${code.trim()}' is already in use.`
          : `Branch code '${code.trim()}' is available.`,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BranchSearchController();
