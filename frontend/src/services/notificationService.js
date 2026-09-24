import api from './api';

const BASE = '/notifications';

export const notificationService = {
  getAll: (params = {}) => api.get(BASE, { params }),
  markRead: (id) => api.put(`${BASE}/${id}/read`),
  markAllRead: () => api.put(`${BASE}/read-all`),
  remove: (id) => api.delete(`${BASE}/${id}`),
  create: (data) => api.post(BASE, data),
};