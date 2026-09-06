import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { sanitizeUser, sanitizePublicUser } from '../utils/helpers.js';
import SecurityLog from '../models/SecurityLog.js';

/**
 * Search users by username (case-insensitive prefix match).
 * Only returns public profile data.
 */
export const searchUsers = async (query, currentUserId, page = 1, limit = 20) => {
  const normalizedQuery = query.toLowerCase().replace(/^@/, '');

  const users = await User.find({
    normalizedUsername: { $regex: `^${normalizedQuery}`, $options: 'i' },
    _id: { $ne: currentUserId }, // Exclude self
  })
    .select('username displayName avatar bio isOnline lastSeen publicKey keyVersion')
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();

  const total = await User.countDocuments({
    normalizedUsername: { $regex: `^${normalizedQuery}`, $options: 'i' },
    _id: { $ne: currentUserId },
  });

  return { users, total };
};

/**
 * Get user public profile by username.
 */
export const getUserByUsername = async (username, currentUserId) => {
  const user = await User.findOne({
    normalizedUsername: username.toLowerCase(),
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Don't expose email or sensitive data
  return sanitizePublicUser(user);
};

/**
 * Update own profile.
 */
export const updateProfile = async (userId, updates) => {
  const allowedUpdates = ['displayName', 'bio', 'avatar'];
  const sanitizedUpdates = {};

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      sanitizedUpdates[key] = updates[key];
    }
  }

  const user = await User.findByIdAndUpdate(userId, sanitizedUpdates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return sanitizeUser(user);
};

/**
 * Upload/update user's public key for E2EE.
 *
 * SECURITY: Only the public key is stored on the server.
 * The private key NEVER leaves the client.
 */
export const updatePublicKey = async (userId, publicKey) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  user.publicKey = publicKey;
  user.keyVersion = (user.keyVersion || 0) + 1;
  await user.save();

  await SecurityLog.create({
    userId,
    action: 'key_uploaded',
    success: true,
    metadata: { keyVersion: user.keyVersion },
  });

  return {
    publicKey: user.publicKey,
    keyVersion: user.keyVersion,
  };
};
