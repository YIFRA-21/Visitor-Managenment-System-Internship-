const departmentRepository = require('../repositories/department.repository');
const departmentValidationService = require('./department-validation.service');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const { AppError } = require('../../../middleware/errorHandler');

class DepartmentService {
  async createDepartment(departmentData, operatorUserId) {
    const errors = await departmentValidationService.validateCreate(departmentData);
    if (errors.length > 0) {
      const err = new AppError('Validation failed.', 400);
      err.errors = errors;
      throw err;
    }

    const department = await departmentRepository.create({
      ...departmentData,
      createdBy: operatorUserId,
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'DEPARTMENT_CREATED',
      module: 'DEPARTMENTS',
      entity: 'departments',
      recordId: department.id,
      newValues: { departmentCode: departmentData.departmentCode, departmentName: departmentData.departmentName },
    });

    return department;
  }

  async getDepartment(id) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found.', 404);
    }
    return department;
  }

  async listDepartments(filters) {
    return departmentRepository.findAll(filters);
  }

  async getDepartmentsByBranch(branchId) {
    return departmentRepository.findAll({ branchId });
  }

  async getDepartmentsByOrganization(orgId) {
    return departmentRepository.findAll({ organizationId: orgId });
  }

  async updateDepartment(id, updateData, operatorUserId) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    const errors = await departmentValidationService.validateUpdate(id, updateData);
    if (errors.length > 0) {
      const err = new AppError('Validation failed.', 400);
      err.errors = errors;
      throw err;
    }

    const updated = await departmentRepository.update(id, {
      ...updateData,
      updatedBy: operatorUserId,
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'DEPARTMENT_UPDATED',
      module: 'DEPARTMENTS',
      entity: 'departments',
      recordId: id,
      newValues: updateData,
    });

    return updated;
  }

  async deleteDepartment(id, operatorUserId) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    await departmentRepository.softDelete(id);

    await auditRepository.log({
      userId: operatorUserId,
      action: 'DEPARTMENT_DELETED',
      module: 'DEPARTMENTS',
      entity: 'departments',
      recordId: id,
    });

    return true;
  }
}

module.exports = new DepartmentService();
