import { Router } from 'express';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import { getAssessments, getHistory, getPerformance, updateAssessmentStatus } from '../controllers/trainerController.js';

const router = Router();
router.use(authenticate, permit('trainer'));

router.get('/assessments', getAssessments);
router.get('/history', getHistory);
router.get('/performance', getPerformance);
router.put('/assessments/:id/status', updateAssessmentStatus);

export default router;
