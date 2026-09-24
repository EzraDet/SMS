import express from 'express';
import {
  getClasses,
  getClass,
  getClassStudents,
  getClassGrading,
  getClassAttendanceSummary,
  getClassStats,
  createClass,
  updateClass,
  assignTeacherToClass,
  deleteClass,
  hardDeleteClass,
} from '../controllers/classController.js';
import { validateRequired } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Specific routes first
router.get('/stats/overview', getClassStats);

router.get('/', getClasses);

router.post(
  '/',
  authorize('admin', 'super_admin'),
  validateRequired(['className', 'grade', 'academicYear']),
  createClass
);

// Class sub-resources (must be before /:id)
router.get('/:id/students', getClassStudents);
router.get('/:id/grading', getClassGrading);
router.get('/:id/attendance-summary', getClassAttendanceSummary);

router.get('/:id', getClass);
router.put('/:id', authorize('admin', 'super_admin'), updateClass);
router.put(
  '/:id/assign-teacher',
  authorize('admin', 'super_admin'),
  assignTeacherToClass
);
router.delete('/:id', authorize('admin', 'super_admin'), deleteClass);
router.delete('/:id/hard', authorize('super_admin'), hardDeleteClass);

export default router;