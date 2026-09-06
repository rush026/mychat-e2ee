import env from '../config/env.js';
import { logger } from '../utils/logger.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Centralized error handling middleware.
 *
 * SECURITY:
 * - Never exposes stack traces in production
 * - Never exposes internal database error details
 * - Returns consistent error response format
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let errors = err.errors || [];

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid ID format';
  }

  // Log the error (never log sensitive data)
  if (statusCode >= 500) {
    logger.error('Server error:', {
      statusCode,
      errorCode,
      message,
      path: req.path,
      method: req.method,
      // Stack trace only in development logs, never in response
      stack: env.isDevelopment ? err.stack : undefined,
    });
  } else if (env.isDevelopment) {
    logger.debug('Client error:', { statusCode, errorCode, message, path: req.path });
  }

  // SECURITY: Never expose stack traces or internal details in production
  if (env.isProduction && statusCode >= 500) {
    message = 'Internal server error';
    errors = [];
  }

  const response = ApiResponse.error(message, errorCode, errors);
  res.status(statusCode).json(response);
};

export default errorHandler;
