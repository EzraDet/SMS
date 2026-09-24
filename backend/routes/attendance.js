import express from 'express';
import {
  getAttendance,
  getAttendanceById,
  getClassAttendance,
  getTodayStats,
  getMonthlyReport,
  getStudentStats,
  createAttendance,
  bulkAttendance,
  updateAttendance,
  deleteAttendance,
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 🔒 All attendance routes require login
router.use(authenticate);

// ==================== READS (any logged-in user) ====================
router.get('/stats/today', getTodayStats);
router.get('/stats/monthly', getMonthlyReport);
router.get('/stats/student/:studentId', getStudentStats);
router.get('/class/:classId/date/:date', getClassAttendance);
router.get('/', getAttendance);
router.get('/:id', getAttendanceById);

// ==================== WRITES (teacher / admin / super_admin) ====================
router.post(
  '/',
  authorize('teacher', 'admin', 'super_admin'),
  createAttendance
);
router.post(
  '/bulk',
  authorize('teacher', 'admin', 'super_admin'),
  bulkAttendance
);
router.put(
  '/:id',
  authorize('teacher', 'admin', 'super_admin'),
  updateAttendance
);

// ==================== DELETE (admin / super_admin only) ====================
router.delete('/:id', authorize('admin', 'super_admin'), deleteAttendance);

export default router;
 