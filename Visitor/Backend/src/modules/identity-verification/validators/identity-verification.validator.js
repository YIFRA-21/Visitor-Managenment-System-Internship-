const { body, param, query } = require('express-validator');

const createCaseValidator = [
  body('docType')
    .optional()
    .isIn(['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'RESIDENCE_PERMIT', 'OTHER'])
    .withMessage('Invalid document type.'),
  body('country')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be a valid country name.'),
];

const submitEvidenceValidator = [
  param('caseId').isNumeric().withMessage('Valid case ID is required.'),
  body('documentType')
    .isIn(['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'RESIDENCE_PERMIT', 'OTHER'])
    .withMessage('Valid document type is required.'),
  body('issuingCountry').isString().notEmpty().withMessage('Issuing country is required.'),
  body('documentNumber').optional().isString().trim(),
];

const reviewDecisionValidator = [
  param('caseId').isNumeric().withMessage('Valid case ID is required.'),
  body('decision')
    .isIn(['APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED'])
    .withMessage('Decision must be APPROVED, REJECTED, or RESUBMISSION_REQUESTED.'),
  body('reviewNotes')
    .isString()
    .trim()
    .isLength({ min: 5, max: 2000 })
    .withMessage('Review notes are required (min 5 characters).'),
];

const policyUpdateValidator = [
  body('isVerificationMandatory').optional().isBoolean(),
  body('gateVisitorPassIssuance').optional().isBoolean(),
  body('requireLivenessCheck').optional().isBoolean(),
  body('requireFaceMatch').optional().isBoolean(),
  body('minFaceMatchConfidence').optional().isFloat({ min: 0, max: 100 }),
];

module.exports = {
  createCaseValidator,
  submitEvidenceValidator,
  reviewDecisionValidator,
  policyUpdateValidator,
};
