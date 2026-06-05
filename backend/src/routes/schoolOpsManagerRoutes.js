import express from 'express';
import { body } from 'express-validator';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import {
  getSchoolOpsManagerDashboard,
  getTrainers,
  getTrainerDetails,
  getAssessments,
  scheduleAssessment,
  updateAssessment,
  deleteAssessment,
  getAssessmentDetails,
  submitFeedback,
  getFeedback,
  getAllFeedback,
  getPerformance,
  getCourses,
  getManagers,
  submitEvaluation,
  getEvaluation,
  updateEvaluation
} from '../controllers/schoolOpsManagerController.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', authenticate, permit('school_ops_manager'), getSchoolOpsManagerDashboard);

// Trainers management
router.get('/trainers', authenticate, permit('school_ops_manager'), getTrainers);
router.get('/trainers/:id', authenticate, permit('school_ops_manager'), getTrainerDetails);

// Courses and Managers (for scheduling)
router.get('/courses', authenticate, permit('school_ops_manager'), getCourses);
router.get('/managers', authenticate, permit('school_ops_manager'), getManagers);

// Assessments management
router.get('/assessments', authenticate, permit('school_ops_manager'), getAssessments);
router.get('/assessments/:id', authenticate, permit('school_ops_manager'), getAssessmentDetails);

// Schedule assessment (NEW functionality for school ops manager)
router.post('/assessments/schedule', 
  authenticate, 
  permit('school_ops_manager'),
  [
    body('course_id').isInt().withMessage('Valid course ID is required'),
    body('trainer_id').isInt().withMessage('Valid trainer ID is required'),
    body('manager_ids').isArray().withMessage('Manager IDs must be an array'),
    body('scheduled_date').isISO8601().withMessage('Valid scheduled date is required')
  ],
  scheduleAssessment
);

// Update assessment
router.put('/assessments/:id', 
  authenticate, 
  permit('school_ops_manager'),
  [
    body('course_id').optional().isInt().withMessage('Valid course ID is required'),
    body('trainer_id').optional().isInt().withMessage('Valid trainer ID is required'),
    body('manager_ids').optional().isArray().withMessage('Manager IDs must be an array'),
    body('scheduled_date').optional().isISO8601().withMessage('Valid scheduled date is required'),
    body('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status')
  ],
  updateAssessment
);

// Delete assessment
router.delete('/assessments/:id', authenticate, permit('school_ops_manager'), deleteAssessment);

// Feedback management
router.get('/feedback', authenticate, permit('school_ops_manager'), getAllFeedback);
router.post('/assessments/:id/feedback',
  authenticate,
  permit('school_ops_manager'),
  [
    body('comments').notEmpty().withMessage('Comments are required'),
    body('recommendations').optional().isString(),
    body('score').optional({ checkFalsy: true }).isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100')
  ],
  submitFeedback
);

router.get('/assessments/:id/feedback', authenticate, permit('school_ops_manager'), getFeedback);

router.put('/feedback/:id', 
  authenticate,
  permit('school_ops_manager'),
  [
    body('comments').optional().isString(),
    body('recommendations').optional().isString(),
    body('score').optional({ checkFalsy: true }).isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100')
  ],
  submitFeedback
);

// Evaluation management
router.post('/evaluations', 
  authenticate, 
  permit('school_ops_manager'),
  [
    body('assessmentId').isInt().withMessage('Valid assessment ID is required'),
    body('timeBasedActivity').isInt({ min: 0, max: 5 }).withMessage('Time Based Activity must be between 0 and 5'),
    body('studentEngagementIdeas').isInt({ min: 0, max: 5 }).withMessage('Student Engagement Ideas must be between 0 and 5'),
    body('poisedAndConfident').isInt({ min: 0, max: 5 }).withMessage('Poised & Confident must be between 0 and 5'),
    body('wellModulatedVoice').isInt({ min: 0, max: 5 }).withMessage('Well Modulated Voice must be between 0 and 5'),
    body('pleasingLook').isInt({ min: 0, max: 5 }).withMessage('Pleasing Look must be between 0 and 5'),
    body('totalScore').isInt().withMessage('Total score is required'),
    body('percentage').isFloat().withMessage('Percentage is required')
  ],
  submitEvaluation
);

router.get('/evaluations/:id', authenticate, permit('school_ops_manager'), getEvaluation);

router.put('/evaluations/:id', 
  authenticate, 
  permit('school_ops_manager'),
  [
    body('timeBasedActivity').isInt({ min: 0, max: 5 }).withMessage('Time Based Activity must be between 0 and 5'),
    body('studentEngagementIdeas').isInt({ min: 0, max: 5 }).withMessage('Student Engagement Ideas must be between 0 and 5'),
    body('poisedAndConfident').isInt({ min: 0, max: 5 }).withMessage('Poised & Confident must be between 0 and 5'),
    body('wellModulatedVoice').isInt({ min: 0, max: 5 }).withMessage('Well Modulated Voice must be between 0 and 5'),
    body('pleasingLook').isInt({ min: 0, max: 5 }).withMessage('Pleasing Look must be between 0 and 5'),
    body('totalScore').isInt().withMessage('Total score is required'),
    body('percentage').isFloat().withMessage('Percentage is required')
  ],
  updateEvaluation
);

// Performance reports
router.get('/performance', authenticate, permit('school_ops_manager'), getPerformance);

export default router;
