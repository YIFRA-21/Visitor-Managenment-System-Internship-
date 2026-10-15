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
    const department = await departmentRepository.findById(id, true);
    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    const currentStatus = department.status;
    if (newStatus && newStatus.toUpperCase() === currentStatus.toUpperCase()) {
      return department;
    }

    const targetStatus = (newStatus || (currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')).toUpperCase();

    await departmentRepository.update(id, { status: targetStatus, deleted_at: null });

    await auditRepository.log({
      userId: actorId,
      action: `DEPARTMENT_STATUS_${targetStatus}`,
      module: 'DEPARTMENTS',
      entity: 'departments',
      recordId: id,
      oldValues: { status: currentStatus },
      newValues: { status: targetStatus, reason: reason || '' },
    });

    return departmentRepository.findById(id, true);
  }

  async getStatusHistory(id) {
    const department = await departmentRepository.findById(id, true);
    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    const history = await departmentRepository.findStatusHistory(id);
    return { department, history };
  }
}

module.exports = new DepartmentStatusService();
