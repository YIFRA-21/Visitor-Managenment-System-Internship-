const { body, query, validationResult } = require('express-validator');
const ApiResponse = require('../../../utils/apiResponse');

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim(),
  query('status').optional().isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Invalid query parameters', errors.array().map(e => e.msg));
    }
    next();
  }
];

const validateTemplateInput = [
  body('templateCode').notEmpty().withMessage('Template code is required').trim(),
  body('subject').notEmpty().withMessage('Subject is required').trim(),
  body('bodyTemplate').notEmpty().withMessage('Body template is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation Error', errors.array().map(e => e.msg));
    }
    next();
  }
];

module.exports = {
  validatePagination,
  validateTemplateInput
};
