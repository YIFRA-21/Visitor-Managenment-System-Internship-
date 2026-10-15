const departmentSearchService = require('../services/department-search.service');

class DepartmentSearchController {
  async search(req, res, next) {
    try {
      const { name, code, organizationId, branchId, type, status, page, limit, sortBy, sortOrder } = req.query;
      const result = await departmentSearchService.searchDepartments(
        { name, code, organizationId, branchId, type, status },
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
      if (!code) {
        return res.status(400).json({ message: 'Code parameter is required.' });
      }
      const taken = await departmentSearchService.isCodeTaken(code, excludeId);
      res.status(200).json({ code, taken });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DepartmentSearchController();
