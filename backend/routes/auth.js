import express from 'express';
import {
  login,
  me,
  register,
  listUsers,
  updateUser,
  deleteUser,
} from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public
router.post('/login', login);

// Protected
router.get('/me', authenticate, me);

// Super Admin only
router.post('/register', authenticate, authorize('super_admin'), register);
router.get('/users', authenticate, authorize('super_admin'), listUsers);
router.put('/users/:id', authenticate, authorize('super_admin'), updateUser);
router.delete('/users/:id', authenticate, authorize('super_admin'), deleteUser);

export default router;