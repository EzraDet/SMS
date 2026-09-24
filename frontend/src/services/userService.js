import api from './api';

const BASE = '/auth';

export const userService = {
  getAll: () => api.get(`${BASE}/users`),
  create: (data) => api.post(`${BASE}/register`, data),
  update: (id, data) => api.put(`${BASE}/users/${id}`, data),
  remove: (id) => api.delete(`${BASE}/users/${id}`),
};