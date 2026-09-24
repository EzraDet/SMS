import api from './api';

const BASE = '/academic-years';

export const academicYearService = {
  getAll: (params = {}) => api.get(BASE, { params }),
  getById: (id) => api.get(`${BASE}/${id}`),
  getActive: () => api.get(`${BASE}/active`),
  create: (data) => api.post(BASE, data),
  update: (id, data) => api.put(`${BASE}/${id}`, data),
  setActive: (id) => api.put(`${BASE}/${id}/set-active`),
  archive: (id) => api.put(`${BASE}/${id}/archive`),
  remove: (id) => api.delete(`${BASE}/${id}`),
};