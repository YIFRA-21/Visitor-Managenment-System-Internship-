class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class PermissionError extends AppError {
  constructor(message = 'Forbidden: Insufficient permissions') {
    super(message, 403);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

module.exports = {
  AppError,
  PermissionError,
  ValidationError,
  NotFoundError
};
