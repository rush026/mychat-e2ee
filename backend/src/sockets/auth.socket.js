import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

/**
 * Socket.IO authentication middleware.
 * Verifies JWT from the handshake auth object.
 *
 * SECURITY: Uses the same JWT verification as the REST API.
 * User identity is always derived from the validated token,
 * never from client-provided data.
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });

    const user = await User.findById(decoded.userId)
      .select('username displayName avatar role');

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user to socket — used by all event handlers
    socket.user = {
      _id: user._id,
      userId: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
    };

    next();
  } catch (error) {
    logger.debug('Socket auth failed:', { error: error.message });
    next(new Error('Authentication failed'));
  }
};
