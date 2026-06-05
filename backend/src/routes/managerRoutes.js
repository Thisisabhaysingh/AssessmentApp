import { Router } from 'express';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import { 
  listTrainers, 
  getAssignedAssessments, 
  submitFeedback, 
  getReports,
  assignManagersToAssessment,
  editFeedback,
  getManagers,
  submitEvaluation,
  getEvaluation,
  updateEvaluation
} from '../controllers/managerController.js';

const router = Router();
router.use(authenticate, permit('manager'));

router.get('/trainers', listTrainers);
router.get('/assessments', getAssignedAssessments); // Get manager's assigned assessments
router.post('/feedback', submitFeedback); // Submit/update feedback for assessment
router.get('/reports', getReports);

// New routes for multiple manager assignment and feedback editing
router.post('/assign-managers', assignManagersToAssessment); // Assign multiple managers to assessment
router.put('/edit-feedback', editFeedback); // Edit existing feedback
router.get('/managers', getManagers); // Get all managers for assignment

// Evaluation routes
router.post('/evaluations', submitEvaluation); // Submit evaluation
router.get('/evaluations/:assessmentId', getEvaluation); // Get evaluation
router.put('/evaluations/:assessmentId', updateEvaluation); // Update evaluation

export default router;
