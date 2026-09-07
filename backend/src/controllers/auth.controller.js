import * as authService from '../services/auth.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import env from '../config/env.js';

/**
 * Cookie options for the refresh token.
 * HttpOnly prevents JS access (XSS protection).
 * Secure flag ensures cookie is only sent over HTTPS in production.
 * SameSite=Strict prevents CSRF.
 */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'strict' : 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Extract client metadata for security logging.
 */
const getClientMeta = (req) => ({
  userAgent: req.headers['user-agent'] || '',
  ipAddress: req.ip || req.connection.remoteAddress || '',
});

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;
    const meta = getClientMeta(req);

    const result = await authService.register(
      { username, email, password, displayName },
      meta
    );

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json(
      ApiResponse.success('Registration successful', {
        user: result.user,
        accessToken: result.accessToken,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const meta = getClientMeta(req);

    const result = await authService.login({ identifier, password }, meta);

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json(
      ApiResponse.success('Login successful', {
        user: result.user,
        accessToken: result.accessToken,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/google
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    const meta = getClientMeta(req);

    if (!credential) {
      return res.status(400).json(
        ApiResponse.error('Google credential is required')
      );
    }

    const result = await authService.googleLogin(credential, meta);

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json(
      ApiResponse.success('Google login successful', {
        user: result.user,
        accessToken: result.accessToken,
      })
    );
  } catch (error) {
    if (error.name === 'ValidationError') {
      console.error('Validation Error Details:', error.errors);
    }
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const meta = getClientMeta(req);

    await authService.logout(refreshToken, req.user._id, meta);

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? 'strict' : 'lax',
      path: '/api/auth',
    });

    res.json(ApiResponse.success('Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const meta = getClientMeta(req);

    const result = await authService.refresh(refreshToken, meta);

    // Set new refresh token cookie (rotation)
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json(
      ApiResponse.success('Token refreshed', {
        user: result.user,
        accessToken: result.accessToken,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const meta = getClientMeta(req);

    await authService.forgotPassword(email, meta);

    // SECURITY: Always return success to prevent email enumeration
    res.json(
      ApiResponse.success('If an account with that email exists, a reset link has been sent')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const meta = getClientMeta(req);

    await authService.resetPassword(token, password, meta);

    res.json(ApiResponse.success('Password reset successful. Please log in with your new password.'));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/verify-email/:token
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await authService.verifyEmail(token);

    res.json(ApiResponse.success('Email verified successfully', { user }));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user._id);
    res.json(ApiResponse.success('User retrieved', { user }));
  } catch (error) {
    next(error);
  }
};
