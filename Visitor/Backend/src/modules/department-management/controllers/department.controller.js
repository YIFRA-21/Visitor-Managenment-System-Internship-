const departmentService = require('../services/department.service');

class DepartmentController {
  async create(req, res, next) {
    try {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const data = {
        departmentName: req.body?.departmentName || `Department ${uniqueSuffix}`,
        departmentCode: req.body?.departmentCode || `DEP-${uniqueSuffix}`,
        organizationId: req.body?.organizationId || 1,
        branchId: req.body?.branchId || 1,
        departmentType: (req.body?.departmentType || 'OPERATIONS').toUpperCase(),
        officeLocation: req.body?.officeLocation || 'Main Office',
        ...req.body
      };
      const department = await departmentService.createDepartment(data, req.user?.id || 1);
      res.status(201).json({
        status: 'success',
        message: 'Department created successfully.',
        data: department,
      });
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const department = await departmentService.getDepartment(req.params.id);
      res.status(200).json(department);
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const departments = await departmentService.listDepartments(req.query);
      res.status(200).json(departments);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const department = await departmentService.updateDepartment(req.params.id, req.body, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Department updated successfully.',
        data: department,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await departmentService.deleteDepartment(req.params.id, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Department deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DepartmentController();
