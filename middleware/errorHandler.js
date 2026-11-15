/**
 * Custom application error class
 */
class AppError extends Error {
  constructor(message, statusCode = 400, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found middleware for unmatched routes
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`
  });
}

/**
 * Centralized error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Check for JSON parsing error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload received',
      errors: [err.message]
    });
  }

  // SQLite Constraint Errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      success: false,
      message: 'Conflict: A record with this unique constraint already exists.',
      error: err.message
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({
      success: false,
      message: 'Foreign key constraint failed. Referenced record does not exist or cannot be modified.',
      error: err.message
    });
  }

  // Application-defined Errors
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  const response = {
    success: false,
    message
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler
};
