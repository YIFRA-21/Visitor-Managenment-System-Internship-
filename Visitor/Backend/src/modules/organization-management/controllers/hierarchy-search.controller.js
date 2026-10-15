const searchService = require('../services/hierarchy-search.service');

class HierarchySearchController {
  async search(req, res, next) {
    try {
      const result = await searchService.searchHierarchy(req.query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HierarchySearchController();
