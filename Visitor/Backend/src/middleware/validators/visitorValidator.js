/**
 * Visitor Validators
 * ──────────────────
 * Validation middleware for visitor registration and profile endpoints.
 */

const {
  required, isEmail, isPhone, minLength, maxLength,
  isIn, isSafeString,
  collectErrors, sendValidationErrors,
} = require('./commonValidator');

const ID_TYPES = ['passport', 'driver_license', 'national_id', 'company_id', 'military_id', 'other'];

function validateVisitorRegistration(req, res, next) {
  const b = req.body;
  const errors = collectErrors([
    required(b, 'fullName', 'Full name'),
    minLength(b, 'fullName', 2, 'Full name'),
    maxLength(b, 'fullName', 120, 'Full name'),
    isSafeString(b, 'fullName', 'Full name'),
    required(b, 'email', 'Email'),
    isEmail(b, 'email', 'Email'),
    isPhone(b, 'phone', 'Phone'),
    isSafeString(b, 'company', 'Company'),
    maxLength(b, 'company', 120, 'Company'),
  ]);
  if (errors.length) return sendValidationErrors(res, errors);
  next();
}

function validateVisitorProfileUpdate(req, res, next) {
  const b = req.body;
  const errors = collectErrors([
    minLength(b, 'fullName', 2, 'Full name'),
    maxLength(b, 'fullName', 120, 'Full name'),
    isSafeString(b, 'fullName', 'Full name'),
    isEmail(b, 'email', 'Email'),
    isPhone(b, 'phone', 'Phone'),
    isSafeString(b, 'company', 'Company'),
    isIn(b, 'idType', ID_TYPES, 'ID type'),
    maxLength(b, 'idNumber', 50, 'ID number'),
    isSafeString(b, 'idNumber', 'ID number'),
  ]);
  if (errors.length) return sendValidationErrors(res, errors);
  next();
}

function validateBlacklistEntry(req, res, next) {
  const b = req.body;
  const errors = collectErrors([
    required(b, 'visitorId', 'Visitor'),
    required(b, 'reason', 'Reason'),
    minLength(b, 'reason', 5, 'Reason'),
    maxLength(b, 'reason', 500, 'Reason'),
    isSafeString(b, 'reason', 'Reason'),
  ]);
  if (errors.length) return sendValidationErrors(res, errors);
  next();
}

module.exports = {
  validateVisitorRegistration,
  validateVisitorProfileUpdate,
  validateBlacklistEntry,
};
