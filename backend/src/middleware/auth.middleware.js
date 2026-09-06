import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

/**
 * Authentication middleware.
 * Verifies the JWT access token from the Authorization header.
 * Attaches the authenticated user to req.user.
 *
 * SECURITY: Never trusts client-provided user IDs.
 * User identity is always derived from the validated JWT.
 */
export const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is required', 'AUTH_TOKEN_REQUIRED');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('Access token is required', 'AUTH_TOKEN_REQUIRED');
    }

    // Verify JWT with explicit algorithm to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });

    // Fetch user from database to ensure account still exists and is active
    const user = await User.findById(decoded.userId).select('+role');

    if (!user) {
      throw ApiError.unauthorized('User not found', 'AUTH_USER_NOT_FOUND');
    }

    // Attach user to request — all downstream handlers use this
    req.user = {
      _id: user._id,
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Access token has expired', 'AUTH_TOKEN_EXPIRED'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized('Invalid access token', 'AUTH_TOKEN_INVALID'));
    }
    next(error);
  }
};

/**
 * Optional authentication — attaches user if token present, but doesn't require it.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });

    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = {
        _id: user._id,
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      };
    }

    next();
  } catch {
    // Token invalid — proceed without auth
    next();
  }
};

/**
 * Require admin role middleware.
 * Must be used AFTER authenticate middleware.
 */
export const requireAdmin = (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return next(ApiError.forbidden('Admin privileges required'));
  }

  next();
};
