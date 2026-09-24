import express from 'express';
import {
  getSubjects,
  getSubject,
  getSubjectStats,
  createSubject,
  updateSubject,
  assignTeacherToSubject,
  deleteSubject,
  hardDeleteSubject,
} from '../controllers/subjectController.js';
import { validateRequired } from '../middleware/validate.js';

const router = express.Router();

// Specific routes first
router.get('/stats/overview', getSubjectStats);

router.get('/', getSubjects);

router.post(
  '/',
  validateRequired(['subjectName', 'grade']),
  createSubject
);

router.get('/:id', getSubject);

router.put('/:id', updateSubject);
router.put('/:id/assign-teacher', assignTeacherToSubject);

router.delete('/:id', deleteSubject);
router.delete('/:id/hard', hardDeleteSubject);

export default router;