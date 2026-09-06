import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import env from '../config/env.js';
import RefreshToken from '../models/RefreshToken.js';
import { hashToken, parseDuration } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Token service — handles JWT access tokens and refresh token management.
 *
 * SECURITY:
 * - Access tokens are short-lived (15min default)
 * - Refresh tokens are stored as SHA-256 hashes in the database
 * - Token rotation: each refresh invalidates the old token
 * - Family tracking: reuse of a rotated token revokes all tokens in the family
 */

/**
 * Generate a JWT access token.
 * @param {object} user - User document
 * @returns {string} JWT token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRY,
      algorithm: 'HS256',
    }
  );
};

/**
 * Generate a refresh token and store its hash in the database.
 * @param {string} userId
 * @param {string} userAgent
 * @param {string} ipAddress
 * @param {string|null} family - Token family ID (null = new family)
 * @returns {Promise<string>} The raw refresh token (to be sent to client)
 */
export const generateRefreshToken = async (userId, userAgent = '', ipAddress = '', family = null) => {
  const rawToken = uuidv4() + '-' + uuidv4(); // 72-char random token
  const tokenFamily = family || uuidv4();

  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRY));

  await RefreshToken.create({
    userId,
    tokenHash: hashToken(rawToken),
    family: tokenFamily,
    userAgent,
    ipAddress,
    expiresAt,
  });

  return rawToken;
};

/**
 * Verify and rotate a refresh token.
 * Returns new access + refresh tokens if valid.
 *
 * SECURITY: Token rotation with family-based reuse detection.
 * If a previously-rotated token is presented (indicating theft),
 * ALL tokens in the family are revoked immediately.
 *
 * @param {string} rawToken
 * @param {string} userAgent
 * @param {string} ipAddress
 * @returns {Promise<{accessToken, refreshToken, userId}>}
 */
export const rotateRefreshToken = async (rawToken, userAgent = '', ipAddress = '') => {
  const tokenHash = hashToken(rawToken);

  const existingToken = await RefreshToken.findOne({ tokenHash });

  if (!existingToken) {
    // Token not found — could be a reuse attack
    // Try to find if this token was previously rotated (revoked)
    logger.warn('Refresh token not found — possible reuse attack');
    return null;
  }

  // Check if token is revoked — REUSE DETECTION
  if (existingToken.isRevoked) {
    // Revoke ALL tokens in this family (attacker may have stolen the token chain)
    logger.warn('Revoked refresh token reused — revoking entire token family', {
      family: existingToken.family,
      userId: existingToken.userId.toString(),
    });

    await RefreshToken.updateMany(
      { family: existingToken.family },
      { isRevoked: true }
    );

    return null;
  }

  // Check expiry
  if (existingToken.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: existingToken._id });
    return null;
  }

  // Revoke the current token (it's being rotated)
  existingToken.isRevoked = true;
  await existingToken.save();

  // Generate new refresh token in the SAME family
  const newRawToken = await generateRefreshToken(
    existingToken.userId,
    userAgent,
    ipAddress,
    existingToken.family
  );

  return {
    refreshToken: newRawToken,
    userId: existingToken.userId,
    family: existingToken.family,
  };
};

/**
 * Revoke all refresh tokens for a user (logout from all devices).
 * @param {string} userId
 */
export const revokeAllUserTokens = async (userId) => {
  await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
};

/**
 * Revoke a specific refresh token.
 * @param {string} rawToken
 */
export const revokeRefreshToken = async (rawToken) => {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
};

/**
 * Get active sessions for a user (for settings/security page).
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getUserSessions = async (userId) => {
  const sessions = await RefreshToken.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).select('userAgent ipAddress createdAt expiresAt').sort('-createdAt');

  return sessions;
};

/**
 * Clean up expired tokens (can be run periodically).
 */
export const cleanupExpiredTokens = async () => {
  const result = await RefreshToken.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true, updatedAt: { $lt: new Date(Date.now() - 86400000) } },
    ],
  });
  logger.info(`Cleaned up ${result.deletedCount} expired/revoked tokens`);
};
