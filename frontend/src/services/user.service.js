import api from './api';

export const userService = {
  searchUsers: (query, page = 1, limit = 20) =>
    api.get(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
  getUserByUsername: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePublicKey: (publicKey) => api.put('/users/public-key', { publicKey }),
};
