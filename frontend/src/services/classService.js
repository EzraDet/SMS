import api from './api';

const BASE = '/classes';

export const classService = {
  // List with filters + pagination
  // Example: classService.getAll({ search: '7A', grade: 7, page: 1, limit: 10 })
  // Example: classService.getAll({ withCounts: 'true' })  → includes studentCount + teacherName
  getAll: (params = {}) => api.get(BASE, { params }),

  // Single class by id
  getById: (id) => api.get(`${BASE}/${id}`),

  // Class + teacher + subjects + enrolled students + stats
  getStudents: (id) => api.get(`${BASE}/${id}/students`),

  // Class grading (auto-calculated total / average / grade per student)
  // Params: { subjectId, type, month }
  getGrading: (classId, params = {}) =>
    api.get(`${BASE}/${classId}/grading`, { params }),

  // Class attendance summary (per-student counts + class totals)
  // Params: { month, year }
  getAttendanceSummary: (classId, params = {}) =>
    api.get(`${BASE}/${classId}/attendance-summary`, { params }),

  // Dashboard stats
  getStats: () => api.get(`${BASE}/stats/overview`),

  // Create / Update
  create: (data) => api.post(BASE, data),
  update: (id, data) => api.put(`${BASE}/${id}`, data),

  // Assign a class teacher
  assignTeacher: (id, teacherId) =>
    api.put(`${BASE}/${id}/assign-teacher`, { teacherId }),

  // Soft delete (status → inactive)
  deactivate: (id) => api.delete(`${BASE}/${id}`),

  // Hard delete (permanent)
  hardDelete: (id) => api.delete(`${BASE}/${id}/hard`),
};