import api from './api';

const BASE = '/scores';

export const scoreService = {
  getAll: (params = {}) => api.get(BASE, { params }),
  getById: (id) => api.get(`${BASE}/${id}`),
  getClassSubjectScores: (classId, subjectId, params = {}) =>
    api.get(`${BASE}/class/${classId}/subject/${subjectId}`, { params }),
  getStudentScores: (studentId, params = {}) =>
    api.get(`${BASE}/student/${studentId}`, { params }),
  getClassRanking: (classId, params = {}) =>
    api.get(`${BASE}/class/${classId}/ranking`, { params }),
  getStats: () => api.get(`${BASE}/stats/overview`),
  create: (data) => api.post(BASE, data),
  bulkSave: (data) => api.post(`${BASE}/bulk`, data),
  update: (id, data) => api.put(`${BASE}/${id}`, data),
  remove: (id) => api.delete(`${BASE}/${id}`),
};