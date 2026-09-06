import { create } from 'zustand';
import { friendService } from '../services/friend.service';

export const useFriendStore = create((set, get) => ({
  friends: [],
  receivedRequests: [],
  sentRequests: [],
  isLoading: false,

  fetchFriends: async () => {
    try {
      const { data } = await friendService.getFriends();
      set({ friends: data.data.friends });
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  },

  fetchReceivedRequests: async () => {
    try {
      const { data } = await friendService.getReceivedRequests();
      set({ receivedRequests: data.data.requests });
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  },

  fetchSentRequests: async () => {
    try {
      const { data } = await friendService.getSentRequests();
      set({ sentRequests: data.data.requests });
    } catch (error) {
      console.error('Failed to fetch sent requests:', error);
    }
  },

  sendRequest: async (receiverId) => {
    const { data } = await friendService.sendRequest(receiverId);
    await get().fetchSentRequests();
    return data;
  },

  acceptRequest: async (id) => {
    await friendService.acceptRequest(id);
    await Promise.all([get().fetchFriends(), get().fetchReceivedRequests()]);
  },

  rejectRequest: async (id) => {
    await friendService.rejectRequest(id);
    await get().fetchReceivedRequests();
  },

  cancelRequest: async (id) => {
    await friendService.cancelRequest(id);
    await get().fetchSentRequests();
  },

  removeFriend: async (id) => {
    await friendService.removeFriend(id);
    set({ friends: get().friends.filter((f) => f._id !== id) });
  },

  blockUser: async (userId) => {
    await friendService.blockUser(userId);
    set({ friends: get().friends.filter((f) => f._id !== userId) });
  },

  // Add friend from socket event
  addFriend: (friend) => {
    set({ friends: [...get().friends, friend] });
  },

  // Add received request from socket event
  addReceivedRequest: (request) => {
    set({ receivedRequests: [request, ...get().receivedRequests] });
  },

  // Remove request by ID
  removeRequest: (requestId) => {
    set({
      receivedRequests: get().receivedRequests.filter((r) => r._id !== requestId),
      sentRequests: get().sentRequests.filter((r) => r._id !== requestId),
    });
  },
}));
