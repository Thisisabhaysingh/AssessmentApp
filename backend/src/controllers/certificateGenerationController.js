import CertificateGenerationService from '../services/certificateGenerationService.js';
import { ok, bad } from '../utils/responseHelper.js';

// Generate certificates when assessment is completed
export const generateCertificatesForAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.body;
    
    if (!assessmentId) {
      return bad(res, 'Assessment ID is required', 400);
    }
    
    const results = await CertificateGenerationService.checkAndGenerateCertificates(assessmentId);
    
    return ok(res, results, 'Certificate generation completed successfully');
  } catch (error) {
    console.error('Error generating certificates for assessment:', error);
    return bad(res, error.message, 500);
  }
};

// Get trainer certificates
export const getTrainerCertificates = async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    if (!trainerId) {
      return bad(res, 'Trainer ID is required', 400);
    }
    
    const certificates = await CertificateGenerationService.getTrainerCertificates(trainerId);
    
    return ok(res, certificates, 'Trainer certificates retrieved successfully');
  } catch (error) {
    console.error('Error getting trainer certificates:', error);
    return bad(res, error.message, 500);
  }
};

// Manual certificate generation for assessment
export const manualGenerateCertificate = async (req, res) => {
  try {
    const { assessmentId } = req.body;
    
    if (!assessmentId) {
      return bad(res, 'Assessment ID is required', 400);
    }
    
    const courseCertificate = await CertificateGenerationService.generateCourseCertificate(assessmentId);
    
    if (!courseCertificate) {
      return bad(res, 'No certificate generated. Assessment may not be completed or may not meet passing criteria.', 400);
    }
    
    return ok(res, { courseCertificate }, 'Certificate generated successfully');
  } catch (error) {
    console.error('Error manually generating certificate:', error);
    return bad(res, error.message, 500);
  }
};

// Manual level certificate generation
export const manualGenerateLevelCertificate = async (req, res) => {
  try {
    const { trainerId, level } = req.body;
    
    if (!trainerId || !level) {
      return bad(res, 'Trainer ID and level are required', 400);
    }
    
    const levelCertificate = await CertificateGenerationService.generateLevelCertificate(trainerId, level);
    
    if (!levelCertificate) {
      return bad(res, 'No certificate generated. Trainer may not have achieved the specified level.', 400);
    }
    
    return ok(res, { levelCertificate }, 'Level certificate generated successfully');
  } catch (error) {
    console.error('Error manually generating level certificate:', error);
    return bad(res, error.message, 500);
  }
};
