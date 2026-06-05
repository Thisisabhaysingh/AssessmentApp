import { Assessment, Certificate, User, Course, Evaluation, SystemSettings } from '../config/db.js';
import CertificateGenerationService from '../services/certificateGenerationService.js';

const generateMissingCertificates = async () => {
  try {
    console.log('🔍 Finding missing certificates for trainer...');
    
    // Get trainer ID 4 (Shivam Saini)
    const trainerId = 4;
    
    // Get all completed assessments for this trainer
    const completedAssessments = await Assessment.findAll({
      where: { 
        trainer_id: trainerId, 
        status: 'Completed' 
      },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name']
        },
        {
          model: Evaluation,
          as: 'evaluations',
          required: true
        }
      ]
    });

    console.log(`📋 Found ${completedAssessments.length} completed assessments for trainer ${trainerId}`);

    // Get passing criteria
    const settings = await SystemSettings.findOne();
    const passingPercentage = settings?.passingPercentage || 60;
    const totalMarks = settings?.totalMarks || 60;

    // Check each assessment for certificate generation
    let certificatesGenerated = 0;
    let certificatesSkipped = 0;

    for (const assessment of completedAssessments) {
      try {
        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
          where: {
            userId: trainerId,
            courseId: assessment.course.id,
            metadata: {
              assessmentId: assessment.id
            }
          }
        });

        if (existingCertificate) {
          console.log(`⏭️ Certificate already exists for assessment ${assessment.id} (${assessment.course.name})`);
          certificatesSkipped++;
          continue;
        }

        // Calculate score to check if passed
        const evaluations = assessment.evaluations || [];
        const schoolOpsEvaluations = evaluations.filter(evaluation => evaluation.evaluator_role === 'school_ops_manager');
        const managerEvaluations = evaluations.filter(evaluation => evaluation.evaluator_role === 'manager');

        const schoolOpsScore = schoolOpsEvaluations.reduce((sum, evaluation) => {
          if (evaluation.totalScore) {
            return sum + evaluation.totalScore;
          } else {
            const scoreFields = ['abilityToIntegrateSTEM', 'discussesUpToDateInfo', 'hasKnowledgeOfSTEM', 'languageFluency', 'preparationWithLessonPlan', 'provideCourseOutline'];
            return sum + scoreFields.reduce((s, field) => s + (evaluation[field] || 0), 0);
          }
        }, 0);

        const managerScore = managerEvaluations.reduce((sum, evaluation) => {
          if (evaluation.totalScore) {
            return sum + evaluation.totalScore;
          } else {
            const scoreFields = ['abilityToIntegrateSTEM', 'discussesUpToDateInfo', 'hasKnowledgeOfSTEM', 'languageFluency', 'preparationWithLessonPlan', 'provideCourseOutline'];
            return sum + scoreFields.reduce((s, field) => s + (evaluation[field] || 0), 0);
          }
        }, 0);

        const combinedScore = schoolOpsScore + managerScore;
        const percentage = Math.round((combinedScore / totalMarks) * 100);

        console.log(`📊 Assessment ${assessment.id} (${assessment.course.name}): ${percentage}% (School Ops: ${schoolOpsScore}, Manager: ${managerScore})`);

        // Generate certificate if passed
        if (percentage >= passingPercentage) {
          console.log(`🎓 Generating certificate for passed assessment ${assessment.id}...`);
          const certificate = await CertificateGenerationService.generateCourseCertificate(assessment.id);
          
          if (certificate) {
            console.log(`✅ Certificate generated: ${certificate.certificateNumber}`);
            certificatesGenerated++;
          } else {
            console.log(`⚠️ Certificate generation failed for assessment ${assessment.id}`);
          }
        } else {
          console.log(`❌ Assessment ${assessment.id} not passed (${percentage}% < ${passingPercentage}%)`);
          certificatesSkipped++;
        }

      } catch (error) {
        console.error(`❌ Error processing assessment ${assessment.id}:`, error);
        certificatesSkipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Certificates generated: ${certificatesGenerated}`);
    console.log(`⏭️ Certificates skipped: ${certificatesSkipped}`);
    console.log(`📋 Total assessments processed: ${completedAssessments.length}`);

  } catch (error) {
    console.error('❌ Error generating missing certificates:', error);
  } finally {
    process.exit(0);
  }
};

// Run the function
generateMissingCertificates();
