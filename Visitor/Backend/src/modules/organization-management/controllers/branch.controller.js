const branchService = require('../services/branch.service');

class BranchController {
  async register(req, res, next) {
    try {
      const operatorId = req.user ? (req.user.id || req.user.user_id) : 1;
      const branch = await branchService.createBranch(req.body, operatorId);
      res.status(201).json({
        success: true,
        message: 'Branch registered successfully.',
        data: branch,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const branches = await branchService.listBranches(req.query);
      res.status(200).json(branches);
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const branch = await branchService.getBranch(req.params.id);
      res.status(200).json(branch);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const operatorId = req.user ? (req.user.id || req.user.user_id) : 1;
      const branch = await branchService.updateBranch(req.params.id, req.body, operatorId);
      res.status(200).json({
        success: true,
        message: 'Branch updated successfully.',
        data: branch,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const operatorId = req.user ? (req.user.id || req.user.user_id) : 1;
      await branchService.deleteBranch(req.params.id, operatorId);
      res.status(200).json({
        success: true,
        message: 'Branch deleted/archived successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BranchController();
