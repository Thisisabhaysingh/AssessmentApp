import { Router } from 'express';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import {
  getTrainerLevel,
  getAllTrainerLevels,
  recalculateTrainerLevel,
  updateAllTrainerLevels,
  getTrainerLevelStats,
  generateL1Certificate
} from '../controllers/trainerLevelController.js';

const router = Router();

// Trainer routes (authenticated trainers only)
router.get('/my-level', authenticate, permit('trainer', 'admin'), getTrainerLevel);

// Admin routes (admin only)
router.get('/all', authenticate, permit('admin'), getAllTrainerLevels);
router.get('/stats', authenticate, permit('admin'), getTrainerLevelStats);
router.post('/recalculate/:trainerId', authenticate, permit('admin'), recalculateTrainerLevel);
router.post('/update-all', authenticate, permit('admin'), updateAllTrainerLevels);
router.post('/generate-certificate/:trainerId', authenticate, permit('admin'), generateL1Certificate);

export default router;
