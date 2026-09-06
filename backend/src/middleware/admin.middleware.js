import ApiError from '../utils/ApiError.js';

/**
 * Admin authorization middleware.
 * Must be used AFTER authenticate middleware.
 * Verifies the authenticated user has admin role.
 */
export const requireAdmin = (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return next(ApiError.forbidden('Admin access required', 'ADMIN_REQUIRED'));
  }

  next();
};
