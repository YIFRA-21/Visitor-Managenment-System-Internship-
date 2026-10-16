const { AppError } = require('./errorHandler');

function validateOrganization(req, res, next) {
  if (!req.body) req.body = {};
  const isPut = req.method === 'PUT' || req.method === 'PATCH';

  // Normalize aliases
  req.body.name = req.body.name || req.body.org_name || req.body.organizationName || req.body.organization_name;
  req.body.shortName = req.body.shortName || req.body.short_name;
  req.body.code = req.body.code || req.body.org_code || req.body.organizationCode;
  req.body.registrationNumber = req.body.registrationNumber || req.body.registration_number || req.body.reg_number;
  req.body.taxNumber = req.body.taxNumber || req.body.tax_number || req.body.tin;
  req.body.email = req.body.email || req.body.org_email || req.body.contactEmail;
  req.body.phone = req.body.phone || req.body.phoneNumber || req.body.phone_number || req.body.contactPhone;

  if (isPut) {
    // On update, all fields are optional
    if (req.body.name && (typeof req.body.name !== 'string' || req.body.name.trim().length < 2)) {
      return next(new AppError('Organization Name must be at least 2 characters.', 400));
    }
    if (req.body.code) {
      req.body.code = String(req.body.code).trim().toUpperCase();
    }
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        req.body.email = 'info@organization.com';
      }
    }
    return next();
  }

  // On POST / registration, apply sensible defaults if missing
  if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim().length < 2) {
    req.body.name = req.body.name?.trim() || 'New Organization';
  }

  if (!req.body.code || typeof req.body.code !== 'string') {
    req.body.code = 'ORG' + String(Date.now()).slice(-4);
  } else {
    req.body.code = String(req.body.code).trim().toUpperCase();
  }

  if (!req.body.registrationNumber || typeof req.body.registrationNumber !== 'string') {
    req.body.registrationNumber = 'REG-' + String(Date.now()).slice(-6);
  }

  if (!req.body.taxNumber || typeof req.body.taxNumber !== 'string') {
    req.body.taxNumber = 'TIN-' + String(Date.now()).slice(-6);
  }

  if (!req.body.email || typeof req.body.email !== 'string') {
    req.body.email = 'org_' + String(Date.now()).slice(-4) + '@example.com';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      req.body.email = 'org_' + String(Date.now()).slice(-4) + '@example.com';
    }
  }

  if (!req.body.phone || typeof req.body.phone !== 'string') {
    req.body.phone = '+251911000000';
  }

  next();
}

function validateBranch(req, res, next) {
  if (!req.body) req.body = {};
  const isPut = req.method === 'PUT' || req.method === 'PATCH';

  // Normalize aliases
  req.body.branchName = req.body.branchName || req.body.branch_name || req.body.name;
  req.body.branchCode = req.body.branchCode || req.body.branch_code || req.body.code;
  req.body.organizationId = req.body.organizationId || req.body.organization_id || req.body.orgId || req.body.org_id;

  if (isPut) {
    // On update, fields are optional
    if (req.body.branchName && (typeof req.body.branchName !== 'string' || req.body.branchName.trim().length < 2)) {
      return next(new AppError('Branch Name must be at least 2 characters.', 400));
    }
    if (req.body.branchCode) {
      req.body.branchCode = String(req.body.branchCode).trim().toUpperCase();
    }
    return next();
  }

  // On POST, apply sensible defaults if missing
  if (!req.body.branchName || typeof req.body.branchName !== 'string' || req.body.branchName.trim().length < 2) {
    req.body.branchName = req.body.branchName?.trim() || 'Main Branch';
  }

  if (!req.body.branchCode || typeof req.body.branchCode !== 'string') {
    req.body.branchCode = 'BR' + String(Date.now()).slice(-4);
  } else {
    req.body.branchCode = String(req.body.branchCode).trim().toUpperCase();
  }

  next();
}

/**
 * Validate status change request body.
 */
function validateStatusChange(req, res, next) {
  if (!req.body) req.body = {};
  const rawStatus = req.body.status || req.body.state || req.body.org_status || req.body.newStatus;

  if (rawStatus && typeof rawStatus === 'string') {
    const allowed = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'];
    const normalized = rawStatus.trim().toUpperCase();
    if (allowed.includes(normalized)) {
      req.body.status = normalized;
    } else {
      req.body.status = 'ACTIVE';
    }
  }

  next();
}

/**
 * Validate and sanitize search query parameters.
 */
function validateSearch(req, res, next) {
  const { page, limit, sortOrder } = req.query;

  if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
    return next(new AppError('Page must be a positive integer.', 400));
  }

  if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return next(new AppError('Limit must be an integer between 1 and 100.', 400));
  }

  if (sortOrder && !['ASC', 'DESC', 'asc', 'desc'].includes(sortOrder)) {
    return next(new AppError("Sort order must be 'ASC' or 'DESC'.", 400));
  }

  next();
}

module.exports = {
  validateOrganization,
  validateBranch,
  validateStatusChange,
  validateSearch,
};

