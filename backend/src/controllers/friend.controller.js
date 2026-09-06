import * as friendService from '../services/friend.service.js';
import ApiResponse from '../utils/ApiResponse.js';

export const sendFriendRequest = async (req, res, next) => {
  try {
    const request = await friendService.sendFriendRequest(req.user._id, req.body.receiverId);
    res.status(201).json(ApiResponse.success('Friend request sent', { request }));
  } catch (error) {
    next(error);
  }
};

export const acceptFriendRequest = async (req, res, next) => {
  try {
    const request = await friendService.acceptFriendRequest(req.params.id, req.user._id);
    res.json(ApiResponse.success('Friend request accepted', { request }));
  } catch (error) {
    next(error);
  }
};

export const rejectFriendRequest = async (req, res, next) => {
  try {
    await friendService.rejectFriendRequest(req.params.id, req.user._id);
    res.json(ApiResponse.success('Friend request rejected'));
  } catch (error) {
    next(error);
  }
};

export const cancelFriendRequest = async (req, res, next) => {
  try {
    await friendService.cancelFriendRequest(req.params.id, req.user._id);
    res.json(ApiResponse.success('Friend request cancelled'));
  } catch (error) {
    next(error);
  }
};

export const removeFriend = async (req, res, next) => {
  try {
    await friendService.removeFriend(req.user._id, req.params.id);
    res.json(ApiResponse.success('Friend removed'));
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    await friendService.blockUser(req.user._id, req.params.userId);
    res.json(ApiResponse.success('User blocked'));
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    await friendService.unblockUser(req.user._id, req.params.userId);
    res.json(ApiResponse.success('User unblocked'));
  } catch (error) {
    next(error);
  }
};

export const getFriends = async (req, res, next) => {
  try {
    const friends = await friendService.getFriends(req.user._id);
    res.json(ApiResponse.success('Friends list', { friends }));
  } catch (error) {
    next(error);
  }
};

export const getReceivedRequests = async (req, res, next) => {
  try {
    const requests = await friendService.getReceivedRequests(req.user._id);
    res.json(ApiResponse.success('Received friend requests', { requests }));
  } catch (error) {
    next(error);
  }
};

export const getSentRequests = async (req, res, next) => {
  try {
    const requests = await friendService.getSentRequests(req.user._id);
    res.json(ApiResponse.success('Sent friend requests', { requests }));
  } catch (error) {
    next(error);
  }
};
