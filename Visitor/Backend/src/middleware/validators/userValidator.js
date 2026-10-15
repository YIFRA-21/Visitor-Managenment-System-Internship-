/**
 * User Validators
 * ────────────────
 * Validation middleware for user management endpoints.
 */

const {
  required, isEmail, isPhone, minLength, maxLength,
  isIn, isSafeString, passwordStrength,
  collectErrors, sendValidationErrors,
} = require('./commonValidator');

const VALID_ROLES = ['admin', 'staff', 'department_manager', 'receptionist', 'security_officer', 'visitor'];
const VALID_STATUSES = ['active', 'inactive', 'suspended', 'locked'];

function validateCreateUser(req, res, next) {
  const b = req.body;
  const errors = collectErrors([
    required(b, 'fullName', 'Full name'),
    minLength(b, 'fullName', 2, 'Full name'),
    maxLength(b, 'fullName', 120, 'Full name'),
    isSafeString(b, 'fullName', 'Full name'),
    required(b, 'email', 'Email'),
    isEmail(b, 'email', 'Email'),
    required(b, 'password', 'Password'),
    passwordStrength(b, 'password', 'Password'),
    isIn(b, 'role', VALID_ROLES, 'Role'),
    isPhone(b, 'phone', 'Phone'),
    isSafeString(b, 'jobTitle', 'Job title'),
    maxLength(b, 'jobTitle', 100, 'Job title'),
  ]);
  if (errors.length) return sendValidationErrors(res, errors);
  next();
}

function validateUpdateUser(req, res, next) {
  const b = req.body;
  const errors = collectErrors([
    minLength(b, 'fullName', 2, 'Full name'),
    maxLength(b, 'fullName', 120, 'Full name'),
    isSafeString(b, 'fullName', 'Full name'),
    isEmail(b, 'email', 'Email'),
    isIn(b, 'role', VALID_ROLES, 'Role'),
    isIn(b, 'status', VALID_STATUSES, 'Status'),
    isPhone(b, 'phone', 'Phone'),
    isSafeString(b, 'jobTitle', 'Job title'),
  ]);
  if (errors.length) return sendValidationErrors(res, errors);
  next();
}

function validateChangePassword(req, res, next) {
  const b = req.body;
  const errors = collectErrors([
    required(b, 'currentPassword', 'Current password'),
    required(b, 'newPassword', 'New password'),
    passwordStrength(b, 'newPassword', 'New password'),
  ]);
  if (errors.length) return sendValidationErrors(res, errors);

  if (b.currentPassword === b.newPassword) {
    return sendValidationErrors(res, [
      { field: 'newPassword', message: 'New password must be different from current password' },
    ]);
  }
  next();
}

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateChangePassword,
};
