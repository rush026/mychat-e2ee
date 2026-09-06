import api from './api';

export const conversationService = {
  getConversations: () => api.get('/conversations'),
  createConversation: (participantId) => api.post('/conversations', { participantId }),
  getConversation: (id) => api.get(`/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/conversations/${id}`),
  getMessages: (id, params = {}) => api.get(`/conversations/${id}/messages`, { params }),
  sendMessage: (id, data) => api.post(`/conversations/${id}/messages`, data),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};
