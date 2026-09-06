import User from '../models/User.js';
import SecurityLog from '../models/SecurityLog.js';
import ApiError from '../utils/ApiError.js';
import { generateToken, hashToken, sanitizeUser } from '../utils/helpers.js';
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from './token.service.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';
import { logger } from '../utils/logger.js';

/**
 * Authentication service — handles all auth business logic.
 * Controllers delegate to this service for clean separation of concerns.
 */

/**
 * Register a new user.
 */
export const register = async ({ username, email, password, displayName }, { userAgent, ipAddress }) => {
  // Check if username already exists (case-insensitive)
  const existingUsername = await User.findOne({
    normalizedUsername: username.toLowerCase(),
  });
  if (existingUsername) {
    throw ApiError.conflict('Username is already taken', 'USERNAME_TAKEN');
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    // SECURITY: Don't reveal that the email exists to prevent enumeration
    // But we still need to prevent duplicate registrations
    throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }

  // Generate email verification token
  const verificationToken = generateToken();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user — password will be hashed by the pre-save hook
  const user = await User.create({
    username,
    email: email.toLowerCase(),
    passwordHash: password, // Will be hashed by pre-save hook
    displayName: displayName || username,
    emailVerificationToken: hashToken(verificationToken),
    emailVerificationExpires: verificationExpiry,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user._id, userAgent, ipAddress);

  // Send verification email (async — don't block registration)
  sendVerificationEmail(user.email, verificationToken).catch((err) => {
    logger.error('Failed to send verification email:', { error: err.message });
  });

  // Log registration
  await SecurityLog.create({
    userId: user._id,
    action: 'register',
    ipAddress,
    userAgent,
    success: true,
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

/**
 * Login with email or username + password.
 */
export const login = async ({ identifier, password }, { userAgent, ipAddress }) => {
  // Find user by email OR username (case-insensitive)
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { normalizedUsername: identifier.toLowerCase() },
    ],
  }).select('+passwordHash');

  if (!user) {
    // SECURITY: Generic message to prevent user enumeration
    await SecurityLog.create({
      action: 'login_failure',
      ipAddress,
      userAgent,
      success: false,
      metadata: { reason: 'user_not_found' },
    });
    throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await SecurityLog.create({
      userId: user._id,
      action: 'login_failure',
      ipAddress,
      userAgent,
      success: false,
      metadata: { reason: 'wrong_password' },
    });
    throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  // Update online status
  user.isOnline = true;
  user.lastSeen = new Date();
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user._id, userAgent, ipAddress);

  // Log successful login
  await SecurityLog.create({
    userId: user._id,
    action: 'login_success',
    ipAddress,
    userAgent,
    success: true,
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

/**
 * Logout — revoke the refresh token.
 */
export const logout = async (rawRefreshToken, userId, { userAgent, ipAddress }) => {
  if (rawRefreshToken) {
    await revokeRefreshToken(rawRefreshToken);
  }

  // Update user's online status
  await User.findByIdAndUpdate(userId, {
    isOnline: false,
    lastSeen: new Date(),
  });

  await SecurityLog.create({
    userId,
    action: 'logout',
    ipAddress,
    userAgent,
    success: true,
  });
};

/**
 * Refresh access token using refresh token.
 */
export const refresh = async (rawRefreshToken, { userAgent, ipAddress }) => {
  if (!rawRefreshToken) {
    throw ApiError.unauthorized('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
  }

  const result = await rotateRefreshToken(rawRefreshToken, userAgent, ipAddress);

  if (!result) {
    throw ApiError.unauthorized('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
  }

  const user = await User.findById(result.userId);
  if (!user) {
    throw ApiError.unauthorized('User not found', 'AUTH_USER_NOT_FOUND');
  }

  const accessToken = generateAccessToken(user);

  await SecurityLog.create({
    userId: user._id,
    action: 'token_refresh',
    ipAddress,
    userAgent,
    success: true,
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: result.refreshToken,
  };
};

/**
 * Request password reset — sends reset email.
 */
export const forgotPassword = async (email, { ipAddress, userAgent }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // SECURITY: Always return success to prevent email enumeration
  if (!user) {
    return; // Don't reveal whether the email exists
  }

  // Generate reset token
  const resetToken = generateToken();
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Send reset email
  await sendPasswordResetEmail(user.email, resetToken);

  await SecurityLog.create({
    userId: user._id,
    action: 'password_reset_request',
    ipAddress,
    userAgent,
    success: true,
  });
};

/**
 * Reset password using token.
 */
export const resetPassword = async (token, newPassword, { ipAddress, userAgent }) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token', 'RESET_TOKEN_INVALID');
  }

  // Update password and clear reset fields
  user.passwordHash = newPassword; // Will be hashed by pre-save hook
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Revoke all existing refresh tokens (force re-login on all devices)
  await revokeAllUserTokens(user._id);

  await SecurityLog.create({
    userId: user._id,
    action: 'password_reset_success',
    ipAddress,
    userAgent,
    success: true,
  });
};

/**
 * Verify email using token.
 */
export const verifyEmail = async (token) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification token', 'VERIFICATION_TOKEN_INVALID');
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  await SecurityLog.create({
    userId: user._id,
    action: 'email_verified',
    success: true,
  });

  return sanitizeUser(user);
};

/**
 * Get current authenticated user.
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return sanitizeUser(user);
};
