const { v4: uuidv4 } = require('uuid');

class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      errors: null,
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    });
  }

  static error(res, message = 'An error occurred', errors = null, statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      errors: Array.isArray(errors) ? errors : errors ? [errors] : null,
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    });
  }

  static badRequest(res, message = 'Bad Request', errors = null) {
    return this.error(res, message, errors, 400);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, null, 401);
  }

  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, null, 403);
  }

  static notFound(res, message = 'Resource Not Found') {
    return this.error(res, message, null, 404);
  }
}

module.exports = ApiResponse;
