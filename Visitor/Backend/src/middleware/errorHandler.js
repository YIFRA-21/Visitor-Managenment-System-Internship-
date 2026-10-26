const environment = require('../config/environment');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || (typeof err.status === 'number' ? err.status : undefined) || 500;
  err.status = err.status || 'error';

  const isDuplicate = err.code === 'ER_DUP_ENTRY' || err.errno === 1062 || (err.message && (
    err.message.toLowerCase().includes('already registered') || 
    err.message.toLowerCase().includes('already exists') ||
    err.message.toLowerCase().includes('duplicate entry')
  ));

  if (err.statusCode === 409 || err.field === 'email' || err.field === 'username' || isDuplicate) {
    const rawSql = err.sqlMessage || err.message || '';
    let message = err.message || 'This record already exists.';
    let field = err.field;
    if (!field) {
      const lower = (rawSql + ' ' + message).toLowerCase();
      if (lower.includes('username') || lower.includes('uq_users_username')) {
        field = 'username';
        message = 'This username is already taken. Please choose another username.';
      } else if (lower.includes('email') || lower.includes('uq_users_email')) {
        field = 'email';
        message = 'This email address is already registered. Please use another email or sign in.';
      } else if (lower.includes('phone')) {
        field = 'phone';
        message = 'This phone number is already registered.';
      } else if (lower.includes('code') || lower.includes('user id')) {
        field = 'userCode';
        message = 'This user ID is already in use.';
      } else {
        field = 'form';
      }
    }
    return res.status(409).json({
      success: false,
      message,
      field,
      errors: {
        [field]: message
      },
      details: [
        { field, message }
      ]
    });
  }

  // Catch SyntaxError (e.g. malformed JSON in request payload or parameter parse)
  if (err instanceof SyntaxError || /unexpected token|is not valid json/i.test(err.message || '')) {
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Invalid data format provided. Please check your request payload.',
      error: 'Invalid data format provided.'
    });
  }

  // General 400 / 409 / 422 Client Validation Error Formatting
  if (err.statusCode === 400 || err.statusCode === 409 || err.statusCode === 422 || err.name === 'ValidationError') {
    const statusCode = err.statusCode || 400;
    const field = err.field || (err.errors ? Object.keys(err.errors)[0] : undefined);
    const message = err.message || 'Validation failed. Please check your inputs.';
    const errorsObj = err.errors || (field ? { [field]: message } : { form: message });

    return res.status(statusCode).json({
      success: false,
      message,
      error: message,
      field,
      errors: errorsObj,
      details: Array.isArray(err.details) ? err.details : [{ field: field || 'form', message }]
    });
  }

  if (environment.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      code: err.code || undefined,
      isBlocked: err.isBlocked || undefined,
      error: err.message || 'An error occurred',
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production Mode
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        code: err.code || undefined,
        isBlocked: err.isBlocked || undefined,
        error: err.message,
        message: err.message,
      });
    } else {
      console.error('ERROR 💥:', err);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong on our end. Please try again later.',
      });
    }
  }
}

module.exports = {
  AppError,
  errorHandler,
};
