import express from 'express';
import {
  getAcademicYears,
  getAcademicYear,
  getActiveYear,
  createAcademicYear,
  updateAcademicYear,
  setActiveYear,
  archiveYear,
  deleteAcademicYear,
} from '../controllers/academicYearController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/active', getActiveYear);
router.get('/', getAcademicYears);
router.get('/:id', getAcademicYear);
router.post('/', authorize('admin', 'super_admin'), createAcademicYear);
router.put('/:id', authorize('admin', 'super_admin'), updateAcademicYear);
router.put('/:id/set-active', authorize('admin', 'super_admin'), setActiveYear);
router.put('/:id/archive', authorize('admin', 'super_admin'), archiveYear);
router.delete('/:id', authorize('super_admin'), deleteAcademicYear);

export default router;