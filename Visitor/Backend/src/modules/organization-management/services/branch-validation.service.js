const branchRepository = require('../repositories/branch.repository');
const orgRepository = require('../repositories/org.repository');
const { AppError } = require('../../../middleware/errorHandler');

class BranchValidationService {
  async validateBranchData(data, excludeId = null) {
    if (!data) data = {};
    const isUpdate = Boolean(excludeId);

    // Normalize field aliases
    data.branchName = data.branchName || data.branch_name || data.name;
    data.branchCode = data.branchCode || data.branch_code || data.code;
    data.organizationId = data.organizationId || data.organization_id || data.orgId || data.org_id;
    data.openingTime = data.openingTime || data.opening_time;
    data.closingTime = data.closingTime || data.closing_time;

    if (isUpdate) {
      // In update mode, all fields are optional
      if (data.branchName && (typeof data.branchName !== 'string' || data.branchName.trim().length < 2)) {
        throw new AppError('Branch Name must be at least 2 characters.', 400);
      }
      if (data.branchCode) {
        data.branchCode = String(data.branchCode).trim().toUpperCase();
        const existing = await branchRepository.findByCode(data.branchCode);
        if (existing && existing.id !== Number(excludeId)) {
          data.branchCode = `${data.branchCode.slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`.toUpperCase();
        }
      }
      return true;
    }

    // In create mode, apply sensible defaults for any omitted fields
    if (!data.branchName || typeof data.branchName !== 'string' || data.branchName.trim().length < 2) {
      data.branchName = data.branchName?.trim() || 'Main Branch';
    }

    if (!data.branchCode || typeof data.branchCode !== 'string') {
      data.branchCode = 'BR' + String(Date.now()).slice(-4);
    } else {
      data.branchCode = String(data.branchCode).trim().toUpperCase();
    }

    // Ensure code uniqueness
    const existing = await branchRepository.findByCode(data.branchCode);
    if (existing) {
      data.branchCode = `${data.branchCode.slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`.toUpperCase();
    }

    data.organizationId = Number(data.organizationId) || 1;
    data.country = data.country || 'Ethiopia';
    data.region = data.region || 'Addis Ababa';
    data.city = data.city || 'Addis Ababa';
    data.address = data.address || 'Main Street';

    if (!data.workingDays || !Array.isArray(data.workingDays) || data.workingDays.length === 0) {
      data.workingDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    }

    if (!data.openingTime) data.openingTime = '08:30';
    if (!data.closingTime) data.closingTime = '17:30';
    if (!data.timezone) data.timezone = 'Africa/Addis_Ababa';

    return true;
  }
}

module.exports = new BranchValidationService();
