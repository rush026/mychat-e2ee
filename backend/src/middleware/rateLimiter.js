import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

/**
 * Rate limiter configurations.
 * Different limits for different endpoint sensitivity levels.
 */

// General API rate limit — 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooMany('Too many requests, please try again later'));
  },
});

// Auth rate limit — stricter to prevent brute-force
// 5 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  handler: (_req, _res, next) => {
    next(ApiError.tooMany('Too many login attempts, please try again later'));
  },
});

// Password reset limit — 3 per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooMany('Too many password reset attempts, please try again later'));
  },
});

// Message sending limit — 30 per minute
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooMany('Message rate limit exceeded, please slow down'));
  },
});
