import api from './api';

const BASE = '/attendance';

export const attendanceService = {
  getAll: (params = {}) => api.get(BASE, { params }),
  getById: (id) => api.get(`${BASE}/${id}`),
  getClassAttendance: (classId, date) =>
    api.get(`${BASE}/class/${classId}/date/${date}`),
  getTodayStats: () => api.get(`${BASE}/stats/today`),
  getMonthlyReport: (params = {}) => api.get(`${BASE}/stats/monthly`, { params }),
  getStudentStats: (studentId) =>
    api.get(`${BASE}/stats/student/${studentId}`),
  create: (data) => api.post(BASE, data),
  bulkSave: (data) => api.post(`${BASE}/bulk`, data),
  update: (id, data) => api.put(`${BASE}/${id}`, data),
  remove: (id) => api.delete(`${BASE}/${id}`),
};