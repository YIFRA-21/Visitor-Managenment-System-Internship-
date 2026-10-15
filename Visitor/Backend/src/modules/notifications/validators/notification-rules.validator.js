const { body, validationResult } = require('express-validator');
const ApiResponse = require('../../../utils/apiResponse');

const validateRuleInput = [
  body('name').notEmpty().withMessage('Rule name is required').trim(),
  body('category').optional().isString(),
  body('module').optional().isString(),
  body('businessEvent').optional().isString(),
  body('triggerType').optional().isIn(['immediate', 'delayed', 'scheduled', 'recurring', 'manual', 'api', 'webhook']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical', 'urgent', 'informational']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation Error', errors.array().map(e => e.msg));
    }
    next();
  }
];

const validateEventProcessInput = [
  body('eventName').notEmpty().withMessage('Event name is required').trim(),
  body('payload').optional().isObject().withMessage('Payload must be an object'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation Error', errors.array().map(e => e.msg));
    }
    next();
  }
];

module.exports = {
  validateRuleInput,
  validateEventProcessInput
};
