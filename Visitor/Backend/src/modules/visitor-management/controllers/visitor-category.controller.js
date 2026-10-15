const service = require('../services/visitor-category.service');

class VisitorCategoryController {
  async getAllCategories(req, res, next) {
    try {
      const result = await service.getAllCategories(req.query);
      res.json({
        status: 'success',
        message: 'Visitor categories fetched successfully.',
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  async getCategoryStats(req, res, next) {
    try {
      const stats = await service.getCategoryStats();
      res.json({
        status: 'success',
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const category = await service.getCategoryById(req.params.id);
      res.json({
        status: 'success',
        data: category
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  }

  async getCategoryByCode(req, res, next) {
    try {
      const category = await service.getCategoryByCode(req.params.code);
      res.json({
        status: 'success',
        data: category
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  }

  async createCategory(req, res, next) {
    try {
      const newCategory = await service.createCategory(req.body, req.user);
      res.status(201).json({
        status: 'success',
        message: 'Visitor category created successfully.',
        data: newCategory
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const updated = await service.updateCategory(req.params.id, req.body, req.user);
      res.json({
        status: 'success',
        message: 'Visitor category updated successfully.',
        data: updated
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  }

  async archiveCategory(req, res, next) {
    try {
      const category = await service.archiveCategory(req.params.id, req.user);
      res.json({
        status: 'success',
        message: 'Visitor category archived successfully.',
        data: category
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  }

  async restoreCategory(req, res, next) {
    try {
      const category = await service.restoreCategory(req.params.id, req.user);
      res.json({
        status: 'success',
        message: 'Visitor category restored successfully.',
        data: category
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      await service.deleteCategory(req.params.id, req.user);
      res.json({
        status: 'success',
        message: 'Visitor category deleted successfully.'
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  }
}

module.exports = new VisitorCategoryController();
