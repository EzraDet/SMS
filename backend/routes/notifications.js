import express from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
  createNotification,
  deleteNotification,
} from '../controllers/notificationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);
router.post('/', authorize('admin', 'super_admin'), createNotification);

export default router;