import express from 'express';
import {
  getScores,
  getScore,
  getClassSubjectScores,
  getStudentScores,
  getClassRanking,
  getScoreStats,
  createScore,
  bulkScores,
  updateScore,
  deleteScore,
} from '../controllers/scoreController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 🔒 All routes require login
router.use(authenticate);

// ==================== READS (any logged-in user) ====================
router.get('/stats/overview', getScoreStats);
router.get('/class/:classId/subject/:subjectId', getClassSubjectScores);
router.get('/class/:classId/ranking', getClassRanking);
router.get('/student/:studentId', getStudentScores);
router.get('/', getScores);
router.get('/:id', getScore);

// ==================== WRITES (teacher / admin / super_admin) ====================
router.post('/', authorize('teacher', 'admin', 'super_admin'), createScore);
router.post('/bulk', authorize('teacher', 'admin', 'super_admin'), bulkScores);
router.put('/:id', authorize('teacher', 'admin', 'super_admin'), updateScore);

// ==================== DELETE (admin / super_admin) ====================
router.delete('/:id', authorize('admin', 'super_admin'), deleteScore);

export default router; 