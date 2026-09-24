import express from 'express';
import { upload, setUploadType } from '../middleware/upload.js';
import { uploadPhoto, deletePhoto } from '../controllers/uploadController.js';
import {
  getTeachers,
  getTeacher,
  getTeacherProfile,
  getTeacherStats,
  createTeacher,
  updateTeacher,
  assignTeacher,
  deleteTeacher,
  hardDeleteTeacher,
} from '../controllers/teacherController.js';
import {
  validateRequired,
  validateEnum,
  validateEmail,
} from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// ==================== READ ====================
router.get('/stats/overview', getTeacherStats);
router.get('/', getTeachers);

// ==================== PHOTO ====================
router.post(
  '/:id/photo',
  authorize('admin', 'super_admin'),
  setUploadType('teacher'),
  upload.single('photo'),
  uploadPhoto('teachers')
);

router.delete(
  '/:id/photo',
  authorize('admin', 'super_admin'),
  deletePhoto('teachers')
);

// ==================== SINGLE ====================
router.get('/:id', getTeacher);
router.get('/:id/profile', getTeacherProfile);

// ==================== WRITE ====================
router.post(
  '/',
  authorize('admin', 'super_admin'),
  validateRequired(['firstName', 'lastName', 'gender']),
  validateEnum('gender', ['male', 'female']),
  validateEmail('email'),
  createTeacher
);

router.put(
  '/:id',
  authorize('admin', 'super_admin'),
  validateEnum('gender', ['male', 'female']),
  validateEmail('email'),
  updateTeacher
);

router.put(
  '/:id/assign',
  authorize('admin', 'super_admin'),
  assignTeacher
);

router.delete('/:id', authorize('admin', 'super_admin'), deleteTeacher);
router.delete('/:id/hard', authorize('super_admin'), hardDeleteTeacher);

export default router;