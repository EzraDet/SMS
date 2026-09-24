import express from 'express';
import { upload, setUploadType } from '../middleware/upload.js';
import { uploadPhoto, deletePhoto } from '../controllers/uploadController.js';
import {
  getStudents,
  getStudent,
  getStudentProfile,
  getStudentStats,
  createStudent,
  updateStudent,
  deleteStudent,
  hardDeleteStudent,
} from '../controllers/studentController.js';
import {
  validateRequired,
  validateEnum,
  validateEmail,
} from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require login
router.use(authenticate);

// ==================== READ ====================
router.get('/stats/overview', getStudentStats);
router.get('/', getStudents);

// ==================== PHOTO (must come BEFORE /:id generic routes) ====================
router.post(
  '/:id/photo',
  authorize('admin', 'super_admin'),
  setUploadType('student'),
  upload.single('photo'),
  uploadPhoto('students')
);

router.delete(
  '/:id/photo',
  authorize('admin', 'super_admin'),
  deletePhoto('students')
);

// ==================== SINGLE STUDENT ====================
router.get('/:id', getStudent);
router.get('/:id/profile', getStudentProfile);

// ==================== CREATE ====================
router.post(
  '/',
  authorize('admin', 'super_admin'),
  validateRequired(['firstName', 'lastName', 'gender']),
  validateEnum('gender', ['male', 'female']),
  validateEmail('email'),
  createStudent
);

// ==================== UPDATE ====================
router.put(
  '/:id',
  authorize('admin', 'super_admin'),
  validateEnum('gender', ['male', 'female']),
  validateEmail('email'),
  updateStudent
);

// ==================== DELETE ====================
router.delete('/:id', authorize('admin', 'super_admin'), deleteStudent);
router.delete('/:id/hard', authorize('super_admin'), hardDeleteStudent);

export default router;