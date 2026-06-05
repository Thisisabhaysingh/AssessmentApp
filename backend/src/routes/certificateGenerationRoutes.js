import { Router } from 'express';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import {
  generateCertificatesForAssessment,
  getTrainerCertificates,
  manualGenerateCertificate,
  manualGenerateLevelCertificate
} from '../controllers/certificateGenerationController.js';

const router = Router();

// Generate certificates for assessment (internal use)
router.post('/assessment', authenticate, permit('admin', 'manager', 'school_ops_manager'), generateCertificatesForAssessment);

// Get trainer certificates (trainer and admin access)
router.get('/trainer/:trainerId', authenticate, permit('trainer', 'admin'), getTrainerCertificates);

// Manual certificate generation (admin only)
router.post('/manual/course', authenticate, permit('admin'), manualGenerateCertificate);
router.post('/manual/level', authenticate, permit('admin'), manualGenerateLevelCertificate);

export default router;
