const departmentRepository = require('../repositories/department.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const { AppError } = require('../../../middleware/errorHandler');

const TRANSITIONS = {
  ACTIVE: ['INACTIVE'],
  INACTIVE: ['ACTIVE'],
};

class DepartmentStatusService {
  getAllowedTransitions(currentStatus) {
    return TRANSITIONS[currentStatus] || [];
  }

  async changeStatus(id, newStatus, reason, actorId) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    const currentStatus = department.status;
    const allowed = this.getAllowedTransitions(currentStatus);

    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}.`,
        400
      );
    }

    await departmentRepository.update(id, { status: newStatus });

    await auditRepository.log({
      userId: actorId,
      action: `DEPARTMENT_STATUS_${newStatus}`,
      module: 'DEPARTMENTS',
      entity: 'departments',
      recordId: id,
      oldValues: { status: currentStatus },
      newValues: { status: newStatus, reason: reason || '' },
    });

    return departmentRepository.findById(id);
  }

  async getStatusHistory(id) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    const history = await departmentRepository.findStatusHistory(id);
    return { department, history };
  }
}

module.exports = new DepartmentStatusService();
