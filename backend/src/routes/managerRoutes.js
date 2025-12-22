import { Router } from 'express';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import { listTrainers, getAssignedAssessments, submitFeedback, getReports } from '../controllers/managerController.js';

const router = Router();
router.use(authenticate, permit('manager'));

router.get('/trainers', listTrainers);
router.get('/assessments', getAssignedAssessments); // Get manager's assigned assessments
router.post('/feedback', submitFeedback); // Submit/update feedback for assessment
router.get('/reports', getReports);

export default router;
