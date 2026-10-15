/**
 * Check-in / Check-out Validators
 * ────────────────────────────────
 */

const {
  required, isSafeString, maxLength,
  collectErrors, sendValidationErrors,
} = require('./commonValidator');

function validateCheckin(req, res, next) {
  const b = req.body;
  const errors = collectErrors([
    required(b, 'referenceCode', 'Reference code or QR token'),
    isSafeString(b, 'referenceCode', 'Reference code'),
    isSafeString(b, 'badgeNumber', 'Badge number'),
    isSafeString(b, 'notes', 'Notes'),
    maxLength(b, 'notes', 500, 'Notes'),
  ]);
  // Allow either referenceCode or qrToken
  if (!b.referenceCode && !b.qrToken) {
    errors.push({ field: 'referenceCode', message: 'Reference code or QR token is required' });
  }
  if (errors.length) return sendValidationErrors(res, errors);
  next();
}

function validateCheckout(req, res, next) {
  const b = req.body;
  const errors = collectErrors([
    isSafeString(b, 'remarks', 'Remarks'),
    maxLength(b, 'remarks', 500, 'Remarks'),
    isSafeString(b, 'checkoutMethod', 'Checkout method'),
  ]);
  if (errors.length) return sendValidationErrors(res, errors);
  next();
}

module.exports = {
  validateCheckin,
  validateCheckout,
};
