import api from './api';

const BASE = '/teachers';

export const teacherService = {
  getAll: (params = {}) => api.get(BASE, { params }),
  getById: (id) => api.get(`${BASE}/${id}`),
  getProfile: (id) => api.get(`${BASE}/${id}/profile`),
  getStats: () => api.get(`${BASE}/stats/overview`),
  create: (data) => api.post(BASE, data),
  update: (id, data) => api.put(`${BASE}/${id}`, data),
  assign: (id, payload) => api.put(`${BASE}/${id}/assign`, payload),
  deactivate: (id) => api.delete(`${BASE}/${id}`),
  hardDelete: (id) => api.delete(`${BASE}/${id}/hard`),
};