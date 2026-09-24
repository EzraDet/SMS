import api from './api';

const BASE = '/subjects';

export const subjectService = {
  getAll: (params = {}) => api.get(BASE, { params }),
  getById: (id) => api.get(`${BASE}/${id}`),
  getStats: () => api.get(`${BASE}/stats/overview`),
  create: (data) => api.post(BASE, data),
  update: (id, data) => api.put(`${BASE}/${id}`, data),
  assignTeacher: (id, teacherId) =>
    api.put(`${BASE}/${id}/assign-teacher`, { teacherId }),
  deactivate: (id) => api.delete(`${BASE}/${id}`),
  hardDelete: (id) => api.delete(`${BASE}/${id}/hard`),
};