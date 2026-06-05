import CertificateGenerationService from '../services/certificateGenerationService.js';

const testCourseCertificate = async () => {
  try {
    console.log('🎯 Testing course certificate generation...');
    
    // Use assessment ID 18 (from the console logs, this is a completed assessment)
    const assessmentId = 18;
    
    // Generate course certificate
    const certificate = await CertificateGenerationService.generateCourseCertificate(assessmentId);
    
    if (certificate) {
      console.log('✅ Course certificate generated successfully!');
      console.log('📋 Certificate details:', {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        courseId: certificate.courseId,
        templateId: certificate.templateId,
        issueDate: certificate.issueDate,
        metadata: certificate.metadata
      });
    } else {
      console.log('ℹ️ No certificate generated - assessment may not qualify');
    }
    
  } catch (error) {
    console.error('❌ Error generating course certificate:', error);
  } finally {
    process.exit(0);
  }
};

// Run the function
testCourseCertificate();
