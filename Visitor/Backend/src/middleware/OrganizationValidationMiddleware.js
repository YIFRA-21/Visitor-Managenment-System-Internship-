const { AppError } = require('./errorHandler');

function validateOrganization(req, res, next) {
  const { name, code, registrationNumber, taxNumber, email, phone } = req.body;

  const errors = [];

  // Validate Organization Name
  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    errors.push('Organization Name is required and must be at least 3 characters.');
  }

  // Validate Organization Code
  if (!code || typeof code !== 'string') {
    errors.push('Organization Code is required.');
  } else {
    const codeRegex = /^[A-Z0-9]{3,10}$/;
    if (!codeRegex.test(code)) {
      errors.push('Organization Code must be uppercase alphanumeric and between 3 and 10 characters.');
    }
  }

  // Validate Registration Number
  if (!registrationNumber || typeof registrationNumber !== 'string' || registrationNumber.trim().length === 0) {
    errors.push('Registration Number is required.');
  }

  // Validate Tax Number (TIN)
  if (!taxNumber || typeof taxNumber !== 'string' || taxNumber.trim().length === 0) {
    errors.push('Tax Number (TIN) is required.');
  }

  // Validate Email
  if (!email || typeof email !== 'string') {
    errors.push('Email is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email address format.');
    }
  }

  // Validate Phone
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    errors.push('Phone number is required.');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(' | '), 400));
  }

  next();
}

function validateBranch(req, res, next) {
  const { branchName, branchCode, timezone } = req.body;
  const errors = [];

  if (!branchName || typeof branchName !== 'string' || branchName.trim().length < 3) {
    errors.push('Branch Name is required and must be at least 3 characters.');
  }

  if (!branchCode || typeof branchCode !== 'string') {
    errors.push('Branch Code is required.');
  } else {
    const codeRegex = /^[A-Z0-9]{2,10}$/;
    if (!codeRegex.test(branchCode)) {
      errors.push('Branch Code must be uppercase alphanumeric and between 2 and 10 characters.');
    }
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(' | '), 400));
  }

  next();
}

module.exports = {
  validateOrganization,
  validateBranch,
  validateStatusChange,
  validateSearch,
};

/**
 * Validate status change request body.
 */
function validateStatusChange(req, res, next) {
  const { status } = req.body;
  const errors = [];

  if (!status || typeof status !== 'string') {
    errors.push('Status is required.');
  } else {
    const allowed = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'];
    if (!allowed.includes(status.toUpperCase())) {
      errors.push(`Invalid status '${status}'. Allowed: ${allowed.join(', ')}.`);
    }
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(' | '), 400));
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
