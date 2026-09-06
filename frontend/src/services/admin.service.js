import api from './api';

export const adminService = {
  getSystemMetrics: () => api.get('/admin/metrics'),
};
