import { Assessment, Course, Feedback, User, Certificate, CertificateTemplate } from '../config/db.js';
import { ok, bad } from '../utils/responseHelper.js';
import { generateCertificatePdf } from '../services/certificateService.js';
import { v4 as uuidv4 } from 'uuid';

// Get trainer's assessment history with feedback
export const getAssessments = async (req, res) => {
  try {
    const trainerId = req.user.id; // Get logged-in trainer's ID
    
    const assessments = await Assessment.findAll({
      where: { trainer_id: trainerId },
      include: [
        { 
          model: Course, 
          as: 'course', 
          attributes: ['id', 'name', 'level', 'description'] 
        },
        { 
          model: User, 
          as: 'manager', 
          attributes: ['id', 'name', 'email'] 
        },
        {
          model: Feedback,
          as: 'feedbacks',
          include: [
            { model: User, as: 'manager', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['scheduled_date', 'DESC']]
    });
    
    // Transform to include single feedback object instead of array
    const transformedAssessments = assessments.map(assessment => {
      const assessmentData = assessment.toJSON();
      assessmentData.feedback = assessmentData.feedbacks?.[0] || null;
      delete assessmentData.feedbacks;
      return assessmentData;
    });
    
    return ok(res, { assessments: transformedAssessments });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

export const getHistory = async (req, res) => {
  return ok(res, { history: [] });
};

export const getPerformance = async (req, res) => {
  return ok(res, { performance: {} });
};

// Update assessment status (for trainers to mark assessments as completed)
export const updateAssessmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { clear_status, score } = req.body;
    const trainerId = req.user.id;

    // Find the assessment and verify it belongs to this trainer
    const assessment = await Assessment.findOne({
      where: { id, trainer_id: trainerId },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'trainer', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!assessment) {
      return bad(res, 'Assessment not found or you do not have permission to update it', 404);
    }

    // Update assessment status
    await assessment.update({
      status: 'Completed',
      clear_status,
      score
    });

    // If assessment is marked as passed, automatically generate a certificate
    if (clear_status === 'Pass') {
      console.log(`🔄 Trainer ${trainerId} marked assessment ${id} as PASS. Starting certificate generation...`);

      try {
        // Check if a certificate already exists for this assessment
        const existingCertificate = await Certificate.findOne({
          where: {
            userId: trainerId,
            courseId: assessment.course_id
          }
        });

        if (existingCertificate) {
          console.log(`⚠️ Certificate already exists for trainer ${trainerId} and course ${assessment.course_id}`);
        } else {
          console.log(`🔍 Looking for certificate template...`);

          // Get default template or first available template
          const defaultTemplate = await CertificateTemplate.findOne({
            where: { status: 'active', isDefault: true }
          });

          let templateToUse = defaultTemplate;
          if (!templateToUse) {
            // If no default template, use the first active template
            templateToUse = await CertificateTemplate.findOne({
              where: { status: 'active' }
            });
          }

          console.log(`📄 Template found: ${templateToUse?.name} (ID: ${templateToUse?.id})`);

          if (templateToUse) {
            console.log(`🎯 Generating certificate for trainer ${assessment.trainer.name}...`);

            // Generate certificate
            const certificateNumber = `CERT-${uuidv4().slice(0, 8).toUpperCase()}`;
            const issueDate = new Date();

            const certificateData = {
              user: assessment.trainer,
              course: assessment.course,
              template: templateToUse,
              certificateNumber,
              issueDate,
              expiryDate: null
            };

            console.log(`📝 Certificate data prepared: ${certificateNumber}, User: ${assessment.trainer.name}`);

            // Generate the certificate file
            const filePath = await generateCertificatePdf(certificateData);
            console.log(`✅ Certificate file generated: ${filePath}`);

            // Create certificate record in database
            const certificate = await Certificate.create({
              userId: trainerId,
              courseId: assessment.course_id,
              templateId: templateToUse.id,
              certificateNumber,
              issueDate,
              status: 'active',
              filePath,
              isAutoGenerated: true,
              metadata: {
                assessmentId: assessment.id,
                generatedAt: new Date().toISOString(),
                reason: 'Assessment completion by trainer'
              }
            });

            console.log(`🎉 Certificate successfully created in database: ID ${certificate.id}, Number: ${certificateNumber}`);
            console.log(`📧 Certificate generated for trainer ${assessment.trainer.name} after passing assessment for course ${assessment.course.name}`);
          } else {
            console.error(`❌ No active certificate template found!`);
          }
        }
      } catch (certError) {
        console.error('❌ Error generating certificate:', certError);
        console.error('Error details:', certError.message, certError.stack);
        // Don't fail the assessment update if certificate generation fails
      }
    }

    // Return updated assessment
    const updatedAssessment = await Assessment.findByPk(id, {
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'trainer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email'] }
      ]
    });

    return ok(res, { assessment: updatedAssessment }, 'Assessment updated successfully');
  } catch (error) {
    console.error('Error updating assessment:', error);
    return bad(res, error.message, 500);
  }
};
