import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token (hex string).
 * @param {number} bytes - Number of random bytes (default 32 = 64 hex chars)
 * @returns {string}
 */
export const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a token using SHA-256 for secure storage.
 * Used for refresh tokens — store hash, compare hash.
 * @param {string} token
 * @returns {string}
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Parse duration string to milliseconds.
 * Supports: '15m', '1h', '7d', '30s'
 * @param {string} duration
 * @returns {number} milliseconds
 */
export const parseDuration = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
};

/**
 * Sanitize user object for API response — strip sensitive fields.
 * @param {object} user - Mongoose user document
 * @returns {object}
 */
export const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.blockedUsers;
  delete obj.__v;
  return obj;
};

/**
 * Sanitize user for public profile — only safe fields.
 * @param {object} user
 * @returns {object}
 */
export const sanitizePublicUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  return {
    _id: obj._id,
    username: obj.username,
    displayName: obj.displayName,
    avatar: obj.avatar,
    bio: obj.bio,
    isOnline: obj.isOnline,
    lastSeen: obj.lastSeen,
    publicKey: obj.publicKey,
    keyVersion: obj.keyVersion,
  };
};
