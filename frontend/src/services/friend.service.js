import api from './api';

export const friendService = {
  getFriends: () => api.get('/friends'),
  getReceivedRequests: () => api.get('/friends/requests'),
  getSentRequests: () => api.get('/friends/requests/sent'),
  sendRequest: (receiverId) => api.post('/friends/request', { receiverId }),
  acceptRequest: (id) => api.post(`/friends/request/${id}/accept`),
  rejectRequest: (id) => api.post(`/friends/request/${id}/reject`),
  cancelRequest: (id) => api.delete(`/friends/request/${id}`),
  removeFriend: (id) => api.delete(`/friends/${id}`),
  blockUser: (userId) => api.post(`/friends/block/${userId}`),
  unblockUser: (userId) => api.delete(`/friends/block/${userId}`),
};
