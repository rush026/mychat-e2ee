import * as userService from '../services/user.service.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * GET /api/users/search?q=
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { q, page, limit } = req.query;
    const { users, total } = await userService.searchUsers(q, req.user._id, page, limit);
    res.json(ApiResponse.paginated('Users found', users, page, limit, total));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:username
 */
export const getUserByUsername = async (req, res, next) => {
  try {
    const user = await userService.getUserByUsername(req.params.username, req.user._id);
    res.json(ApiResponse.success('User profile', { user }));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    res.json(ApiResponse.success('Profile updated', { user }));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/public-key
 */
export const updatePublicKey = async (req, res, next) => {
  try {
    const result = await userService.updatePublicKey(req.user._id, req.body.publicKey);
    res.json(ApiResponse.success('Public key updated', result));
  } catch (error) {
    next(error);
  }
};
