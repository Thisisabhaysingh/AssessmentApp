import { Assessment, Course, Feedback, User, Certificate, CertificateTemplate } from '../config/db.js';
import { ok, bad } from '../utils/responseHelper.js';
import { generateCertificatePdf } from '../services/certificateService.js';
import { v4 as uuidv4 } from 'uuid';

export const listTrainers = async (_req, res) => {
  const trainers = await User.findAll({ where: { role: 'trainer' } });
  return ok(res, { trainers });
};

// Get assessments assigned to the logged-in manager
export const getAssignedAssessments = async (req, res) => {
  try {
    const managerId = req.user.id; // Get logged-in manager's ID
    
    const assessments = await Assessment.findAll({
      where: { manager_id: managerId },
      include: [
        { 
          model: Course, 
          as: 'course', 
          attributes: ['id', 'name', 'level'] 
        },
        { 
          model: User, 
          as: 'trainer', 
          attributes: ['id', 'name', 'email', 'department'] 
        },
        {
          model: Feedback,
          as: 'feedbacks',
          where: { manager_id: managerId },
          required: false // LEFT JOIN to include assessments without feedback
        }
      ],
      order: [['scheduled_date', 'DESC']]
    });
    
    return ok(res, { assessments });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Submit or update feedback for an assessment
export const submitFeedback = async (req, res) => {
  try {
    const { assessment_id, feedback_text, score, pass_fail } = req.body;
    const managerId = req.user.id;

    // Validate required fields
    if (!assessment_id || !feedback_text || score === undefined || !pass_fail) {
      return bad(res, 'Assessment ID, feedback text, score, and pass/fail status are required', 400);
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      where: { assessment_id, manager_id: managerId }
    });

    if (existingFeedback) {
      // Update existing feedback
      await existingFeedback.update({ feedback_text, score, pass_fail });

      // Update assessment status and score
      await Assessment.update(
        {
          status: 'Completed',
          score,
          clear_status: pass_fail
        },
        { where: { id: assessment_id } }
      );

      return ok(res, { feedback: existingFeedback }, 'Feedback updated successfully');
    } else {
      // Create new feedback
      const feedback = await Feedback.create({
        assessment_id,
        manager_id: managerId,
        feedback_text,
        score,
        pass_fail
      });

      // Update assessment status and score
      await Assessment.update(
        {
          status: 'Completed',
          score,
          clear_status: pass_fail
        },
        { where: { id: assessment_id } }
      );

      // If assessment is marked as passed, automatically generate a certificate
      if (pass_fail === 'Pass') {
        console.log(`🔄 Manager ${managerId} submitted PASS feedback for assessment ${assessment_id}. Starting certificate generation...`);

        try {
          // Get the assessment with trainer and course details
          const assessment = await Assessment.findByPk(assessment_id, {
            include: [
              { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
              { model: User, as: 'trainer', attributes: ['id', 'name', 'email'] }
            ]
          });

          console.log(`📋 Assessment found: ${assessment?.id}, Trainer: ${assessment?.trainer?.name}, Course: ${assessment?.course?.name}`);

          if (assessment) {
            // Check if a certificate already exists for this assessment
            const existingCertificate = await Certificate.findOne({
              where: {
                userId: assessment.trainer_id,
                courseId: assessment.course_id
              }
            });

            if (existingCertificate) {
              console.log(`⚠️ Certificate already exists for trainer ${assessment.trainer_id} and course ${assessment.course_id}`);
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
                  userId: assessment.trainer_id,
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
                    reason: 'Manager feedback - assessment passed',
                    managerId: managerId
                  }
                });

                console.log(`🎉 Certificate successfully created in database: ID ${certificate.id}, Number: ${certificateNumber}`);
                console.log(`📧 Certificate generated by manager ${managerId} for trainer ${assessment.trainer.name} after passing assessment for course ${assessment.course.name}`);
              } else {
                console.error(`❌ No active certificate template found!`);
              }
            }
          } else {
            console.error(`❌ Assessment not found: ${assessment_id}`);
          }
        } catch (certError) {
          console.error('❌ Error generating certificate:', certError);
          console.error('Error details:', certError.message, certError.stack);
          // Don't fail the feedback submission if certificate generation fails
        }
      }

      return ok(res, { feedback }, 'Feedback submitted successfully');
    }
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

export const getReports = async (_req, res) => {
  // Minimal mock response; expand later
  const completed = await Assessment.count({ where: { status: 'Completed' } });
  return ok(res, { completed });
};
