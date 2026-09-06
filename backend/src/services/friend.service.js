import mongoose from 'mongoose';
import FriendRequest from '../models/FriendRequest.js';
import Friendship from '../models/Friendship.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import SecurityLog from '../models/SecurityLog.js';

/**
 * Send a friend request.
 */
export const sendFriendRequest = async (senderId, receiverId) => {
  if (senderId.toString() === receiverId.toString()) {
    throw ApiError.badRequest('Cannot send a friend request to yourself');
  }

  // Check receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw ApiError.notFound('User not found');
  }

  // Check if blocked
  const sender = await User.findById(senderId).select('+blockedUsers');
  if (receiver.blockedUsers?.includes(senderId)) {
    throw ApiError.forbidden('Cannot send a friend request to this user');
  }
  if (sender.blockedUsers?.includes(receiverId)) {
    throw ApiError.badRequest('You have blocked this user. Unblock them first.');
  }

  // Check if already friends
  const existingFriendship = await Friendship.findFriendship(senderId, receiverId);
  if (existingFriendship) {
    throw ApiError.conflict('You are already friends with this user', 'ALREADY_FRIENDS');
  }

  // Check for existing pending request in either direction
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { sender: senderId, receiver: receiverId, status: 'pending' },
      { sender: receiverId, receiver: senderId, status: 'pending' },
    ],
  });

  if (existingRequest) {
    if (existingRequest.sender.toString() === senderId.toString()) {
      throw ApiError.conflict('Friend request already sent', 'REQUEST_ALREADY_SENT');
    }
    // Other user already sent us a request — auto-accept
    return acceptFriendRequest(existingRequest._id, senderId);
  }

  const request = await FriendRequest.create({
    sender: senderId,
    receiver: receiverId,
  });

  return request.populate(['sender', 'receiver'], 'username displayName avatar isOnline');
};

/**
 * Accept a friend request.
 */
export const acceptFriendRequest = async (requestId, userId) => {
  const request = await FriendRequest.findById(requestId);

  if (!request) {
    throw ApiError.notFound('Friend request not found');
  }

  // Only the receiver can accept
  if (request.receiver.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the recipient can accept this request');
  }

  if (request.status !== 'pending') {
    throw ApiError.badRequest('This request has already been processed');
  }

  // Use transaction to ensure atomicity
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    request.status = 'accepted';
    await request.save({ session });

    await Friendship.createFriendship(request.sender, request.receiver);

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return request.populate(['sender', 'receiver'], 'username displayName avatar isOnline');
};

/**
 * Reject a friend request.
 */
export const rejectFriendRequest = async (requestId, userId) => {
  const request = await FriendRequest.findById(requestId);

  if (!request) {
    throw ApiError.notFound('Friend request not found');
  }

  if (request.receiver.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the recipient can reject this request');
  }

  if (request.status !== 'pending') {
    throw ApiError.badRequest('This request has already been processed');
  }

  request.status = 'rejected';
  await request.save();

  return request;
};

/**
 * Cancel a sent friend request.
 */
export const cancelFriendRequest = async (requestId, userId) => {
  const request = await FriendRequest.findById(requestId);

  if (!request) {
    throw ApiError.notFound('Friend request not found');
  }

  // Only the sender can cancel
  if (request.sender.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the sender can cancel this request');
  }

  if (request.status !== 'pending') {
    throw ApiError.badRequest('This request has already been processed');
  }

  await FriendRequest.findByIdAndDelete(requestId);
};

/**
 * Remove a friend.
 */
export const removeFriend = async (userId, friendId) => {
  const friendship = await Friendship.findFriendship(userId, friendId);

  if (!friendship) {
    throw ApiError.notFound('Friendship not found');
  }

  await Friendship.findByIdAndDelete(friendship._id);
};

/**
 * Block a user.
 */
export const blockUser = async (userId, targetId) => {
  if (userId.toString() === targetId.toString()) {
    throw ApiError.badRequest('Cannot block yourself');
  }

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const target = await User.findById(targetId);
  if (!target) throw ApiError.notFound('User not found');

  if (user.blockedUsers.includes(targetId)) {
    throw ApiError.conflict('User is already blocked');
  }

  // Block and remove friendship if exists
  user.blockedUsers.push(targetId);
  await user.save();

  // Remove friendship if any
  const friendship = await Friendship.findFriendship(userId, targetId);
  if (friendship) {
    await Friendship.findByIdAndDelete(friendship._id);
  }

  // Remove any pending requests
  await FriendRequest.deleteMany({
    $or: [
      { sender: userId, receiver: targetId },
      { sender: targetId, receiver: userId },
    ],
  });

  await SecurityLog.create({
    userId,
    action: 'friend_blocked',
    success: true,
    metadata: { blockedUserId: targetId.toString() },
  });
};

/**
 * Unblock a user.
 */
export const unblockUser = async (userId, targetId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  user.blockedUsers = user.blockedUsers.filter(
    (id) => id.toString() !== targetId.toString()
  );
  await user.save();
};

/**
 * Get all friends of a user.
 */
export const getFriends = async (userId) => {
  const friendships = await Friendship.getFriends(userId);

  const friendIds = friendships.map((f) =>
    f.user1.toString() === userId.toString() ? f.user2 : f.user1
  );

  const friends = await User.find({ _id: { $in: friendIds } })
    .select('username displayName avatar bio isOnline lastSeen publicKey keyVersion')
    .lean();

  return friends;
};

/**
 * Get pending friend requests (received).
 */
export const getReceivedRequests = async (userId) => {
  return FriendRequest.find({ receiver: userId, status: 'pending' })
    .populate('sender', 'username displayName avatar isOnline')
    .sort('-createdAt');
};

/**
 * Get sent friend requests.
 */
export const getSentRequests = async (userId) => {
  return FriendRequest.find({ sender: userId, status: 'pending' })
    .populate('receiver', 'username displayName avatar isOnline')
    .sort('-createdAt');
};
