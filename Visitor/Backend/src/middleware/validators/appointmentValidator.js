/**
 * Appointment Validators
 * ──────────────────────
 * Validation middleware for appointment endpoints.
 */

const {
  required, isEmail, isPhone, isDateTime, isIn,
  minLength, maxLength, isSafeString, dateNotInPast, dateRange,
  collectErrors, sendValidationErrors,
} = require('./commonValidator');

const VISIT_TYPES = ['business', 'interview', 'delivery', 'contractor', 'personal', 'vip', 'group', 'other'];

function validateCreateAppointment(req, res, next) {
  const b = req.body;
  const errors = collectErrors([
    // Visitor info (required if no visitorId)
    ...(b.visitorId
      ? []
      : [
          required(b, 'visitorName', 'Visitor name'),
          required(b, 'visitorEmail', 'Visitor email'),
          isEmail(b, 'visitorEmail', 'Visitor email'),
        ]),
    isPhone(b, 'visitorPhone', 'Visitor phone'),
    isSafeString(b, 'company', 'Company'),

    // Appointment details
    required(b, 'hostId', 'Host'),
    required(b, 'scheduledStart', 'Start time'),
    required(b, 'scheduledEnd', 'End time'),
    isDateTime(b, 'scheduledStart', 'Start time'),
    isDateTime(b, 'scheduledEnd', 'End time'),
    dateNotInPast(b, 'scheduledStart', 'Start time'),
    dateRange(b, 'scheduledStart', 'scheduledEnd'),

    // Optional fields
    isSafeString(b, 'purpose', 'Purpose'),
    maxLength(b, 'purpose', 500, 'Purpose'),
    isIn(b, 'visitType', VISIT_TYPES, 'Visit type'),
  ]);

  if (errors.length) return sendValidationErrors(res, errors);
  next();
}

function validateReschedule(req, res, next) {
  const b = req.body;
  const errors = collectErrors([
    required(b, 'scheduledStart', 'New start time'),
    required(b, 'scheduledEnd', 'New end time'),
    isDateTime(b, 'scheduledStart', 'New start time'),
    isDateTime(b, 'scheduledEnd', 'New end time'),
    dateNotInPast(b, 'scheduledStart', 'New start time'),
    dateRange(b, 'scheduledStart', 'scheduledEnd'),
    isSafeString(b, 'comment', 'Comment'),
    maxLength(b, 'comment', 500, 'Comment'),
  ]);
  if (errors.length) return sendValidationErrors(res, errors);
  next();
}

function validateApprovalDecision(req, res, next) {
  const b = req.body;
  const errors = collectErrors([
    isSafeString(b, 'comment', 'Comment'),
    maxLength(b, 'comment', 1000, 'Comment'),
  ]);
  if (errors.length) return sendValidationErrors(res, errors);
  next();
}

module.exports = {
  validateCreateAppointment,
  validateReschedule,
  validateApprovalDecision,
};
