const branchRepository = require('../repositories/branch.repository');
const orgRepository = require('../repositories/org.repository');
const { AppError } = require('../../../middleware/errorHandler');

class BranchValidationService {
  async validateBranchData(data, excludeId = null) {
    const { branchName, branchCode, organizationId, email, phone, website, country, region, city, address, workingDays, openingTime, closingTime, timezone } = data;
    const errors = [];

    // General Validation
    if (!branchName || typeof branchName !== 'string' || branchName.trim().length < 3) {
      errors.push('Branch Name is required and must be at least 3 characters.');
    }

    if (!branchCode || typeof branchCode !== 'string') {
      errors.push('Branch Code is required.');
    } else {
      const codeRegex = /^[A-Z0-9-]{3,15}$/;
      if (!codeRegex.test(branchCode)) {
        errors.push('Branch Code must be alphanumeric/dashes, between 3 and 15 characters.');
      } else {
        const existing = await branchRepository.findByCode(branchCode);
        if (existing && (!excludeId || existing.id !== Number(excludeId))) {
          errors.push(`Branch Code '${branchCode}' is already in use.`);
        }
      }
    }

    if (!organizationId) {
      errors.push('Organization ID is required.');
    } else {
      const org = await orgRepository.findOrgById(organizationId);
      if (!org) {
        errors.push(`Organization with ID ${organizationId} does not exist.`);
      }
    }

    // Contact Validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Invalid email address format.');
      }
    }

    if (phone) {
      const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
      if (!phoneRegex.test(phone)) {
        errors.push('Invalid phone number format.');
      }
    }

    if (website) {
      const webRegex = /^https?:\/\/.+/;
      if (!webRegex.test(website)) {
        errors.push('Website must be a valid URL starting with http:// or https://.');
      }
    }

    // Address Validation
    if (!country || country.trim().length === 0) errors.push('Country is required.');
    if (!region || region.trim().length === 0) errors.push('Region is required.');
    if (!city || city.trim().length === 0) errors.push('City is required.');
    if (!address || address.trim().length === 0) errors.push('Street address is required.');

    // Operating Hours Validation
    if (!workingDays || !Array.isArray(workingDays) || workingDays.length === 0) {
      errors.push('At least one working day must be selected.');
    }

    if (!openingTime || !closingTime) {
      errors.push('Both opening and closing times are required.');
    } else {
      const [openH, openM] = openingTime.split(':').map(Number);
      const [closeH, closeM] = closingTime.split(':').map(Number);
      const openVal = openH * 60 + openM;
      const closeVal = closeH * 60 + closeM;
      if (closeVal <= openVal) {
        errors.push('Closing Time must be after Opening Time.');
      }
    }

    if (!timezone) {
      errors.push('Operating Time Zone is required.');
    }

    if (errors.length > 0) {
      throw new AppError(errors.join(' | '), 400);
    }
    return true;
  }
}

module.exports = new BranchValidationService();
