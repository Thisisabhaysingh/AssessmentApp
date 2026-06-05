import express from 'express';
import { body } from 'express-validator';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import {
  getActivitiesByCourse,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  reorderActivities,
  duplicateActivity
} from '../controllers/activityController.js';

const router = express.Router();

// Validation middleware
const validateActivity = [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['reading', 'video', 'quiz', 'assignment', 'practical', 'project']).withMessage('Invalid activity type'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('passingScore').optional().isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100'),
  body('maxAttempts').optional().isInt({ min: 1 }).withMessage('Max attempts must be at least 1')
];

// Get all activities for a course
router.get('/course/:courseId', authenticate, permit('admin'), getActivitiesByCourse);

// Get single activity
router.get('/:id', authenticate, permit('admin'), getActivity);

// Create new activity
router.post('/course/:courseId', 
  authenticate, 
  permit('admin'), 
  validateActivity, 
  createActivity
);

// Update activity
router.put('/:id', 
  authenticate, 
  permit('admin'), 
  validateActivity, 
  updateActivity
);

// Delete activity
router.delete('/:id', authenticate, permit('admin'), deleteActivity);

// Reorder activities
router.put('/course/:courseId/reorder', 
  authenticate, 
  permit('admin'), 
  [
    body('activities').isArray().withMessage('Activities array is required'),
    body('activities.*.id').isInt().withMessage('Activity ID is required'),
    body('activities.*.order').isInt({ min: 1 }).withMessage('Order is required')
  ],
  reorderActivities
);

// Duplicate activity
router.post('/:id/duplicate', authenticate, permit('admin'), duplicateActivity);

export default router;
