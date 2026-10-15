const departmentRepository = require('../repositories/department.repository');
const branchRepository = require('../../organization-management/repositories/branch.repository');
const orgRepository = require('../../organization-management/repositories/org.repository');

class DepartmentValidationService {
  async validateCreate(data) {
    const errors = [];

    // Department Name
    if (!data.departmentName || data.departmentName.trim().length < 3) {
      errors.push({ field: 'departmentName', message: 'Department name is required (minimum 3 characters).' });
    }

    // Department Code
    if (!data.departmentCode || !/^[A-Z0-9-]{3,15}$/.test(data.departmentCode)) {
      errors.push({ field: 'departmentCode', message: 'Department code must be uppercase alphanumeric/dashes, 3–15 characters.' });
    } else {
      const existing = await departmentRepository.findByCode(data.departmentCode);
      if (existing) {
        errors.push({ field: 'departmentCode', message: `Department code '${data.departmentCode}' is already in use.` });
      }
    }

    // Organization
    if (!data.organizationId) {
      errors.push({ field: 'organizationId', message: 'Parent organization is required.' });
    } else {
      try {
        const org = await orgRepository.findOrgById(data.organizationId);
        if (!org) errors.push({ field: 'organizationId', message: 'Selected organization does not exist.' });
      } catch {
        // Mock mode — skip org check
      }
    }

    // Branch
    if (!data.branchId) {
      errors.push({ field: 'branchId', message: 'Parent branch is required.' });
    } else {
      try {
        const branch = await branchRepository.findById(data.branchId);
        if (!branch) errors.push({ field: 'branchId', message: 'Selected branch does not exist.' });
      } catch {
        // Mock mode — skip branch check
      }
    }

    // Department Type
    const VALID_TYPES = ['ADMINISTRATIVE', 'TECHNICAL', 'OPERATIONS', 'SUPPORT', 'FINANCE', 'HR', 'LEGAL', 'EXECUTIVE'];
    if (!data.departmentType || !VALID_TYPES.includes(data.departmentType.toUpperCase())) {
      errors.push({ field: 'departmentType', message: `Department type must be one of: ${VALID_TYPES.join(', ')}.` });
    }

    // Office Location
    if (!data.officeLocation || data.officeLocation.trim().length < 2) {
      errors.push({ field: 'officeLocation', message: 'Office location is required.' });
    }

    // Schedule validation
    if (data.workingDays && data.openingTime && data.closingTime) {
      const schedErrors = this.validateSchedule(data.workingDays, data.openingTime, data.closingTime);
      errors.push(...schedErrors);
    }

    return errors;
  }

  async validateUpdate(id, data) {
    const errors = [];

    if (data.departmentName !== undefined && data.departmentName.trim().length < 3) {
      errors.push({ field: 'departmentName', message: 'Department name must be at least 3 characters.' });
    }

    if (data.officeLocation !== undefined && data.officeLocation.trim().length < 2) {
      errors.push({ field: 'officeLocation', message: 'Office location is required.' });
    }

    const VALID_TYPES = ['ADMINISTRATIVE', 'TECHNICAL', 'OPERATIONS', 'SUPPORT', 'FINANCE', 'HR', 'LEGAL', 'EXECUTIVE'];
    if (data.departmentType && !VALID_TYPES.includes(data.departmentType.toUpperCase())) {
      errors.push({ field: 'departmentType', message: `Invalid department type.` });
    }

    if (data.workingDays && data.openingTime && data.closingTime) {
      const schedErrors = this.validateSchedule(data.workingDays, data.openingTime, data.closingTime);
      errors.push(...schedErrors);
    }

    return errors;
  }

  validateSchedule(workingDays, openingTime, closingTime) {
    const errors = [];
    const VALID_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    if (!Array.isArray(workingDays) || workingDays.length === 0) {
      errors.push({ field: 'workingDays', message: 'At least one working day is required.' });
    } else {
      const invalid = workingDays.filter(d => !VALID_DAYS.includes(d));
      if (invalid.length > 0) {
        errors.push({ field: 'workingDays', message: `Invalid working days: ${invalid.join(', ')}.` });
      }
    }

    if (openingTime && closingTime) {
      const [oH, oM] = openingTime.split(':').map(Number);
      const [cH, cM] = closingTime.split(':').map(Number);
      if (cH * 60 + cM <= oH * 60 + oM) {
        errors.push({ field: 'closingTime', message: 'Closing time must be after opening time.' });
      }
    }

    return errors;
  }
}

module.exports = new DepartmentValidationService();
