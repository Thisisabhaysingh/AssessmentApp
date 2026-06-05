import TrainerLevelService from '../services/trainerLevelService.js';

const generateL1Certificate = async () => {
  try {
    console.log('🎯 Generating L1 certificate for trainer...');
    
    // Get trainer ID 4 (from the console logs)
    const trainerId = 4;
    
    // Generate L1 certificate
    const certificate = await TrainerLevelService.generateL1Certificate(trainerId);
    
    if (certificate) {
      console.log('✅ L1 certificate generated successfully!');
      console.log('📋 Certificate details:', {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        issueDate: certificate.issueDate,
        templateId: certificate.templateId
      });
    } else {
      console.log('ℹ️ No certificate generated - trainer may not qualify for L1');
    }
    
  } catch (error) {
    console.error('❌ Error generating L1 certificate:', error);
  } finally {
    process.exit(0);
  }
};

// Run the function
generateL1Certificate();
