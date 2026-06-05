import { Assessment, Course, Feedback, User, Certificate, CertificateTemplate, AssessmentManager, Evaluation } from '../config/db.js';
import { ok, bad } from '../utils/responseHelper.js';
import { Op } from 'sequelize';
import { generateCertificatePdf } from '../services/certificateService.js';
import { v4 as uuidv4 } from 'uuid';
import CertificateGenerationService from '../services/certificateGenerationService.js';

export const listTrainers = async (_req, res) => {
  const trainers = await User.findAll({ where: { role: 'trainer' } });
  return ok(res, { trainers });
};

// Get assessments assigned to the logged-in manager
export const getAssignedAssessments = async (req, res) => {
  try {
    const managerId = req.user.id; // Get logged-in manager's ID
    
    const assessments = await Assessment.findAll({
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
          model: User,
          as: 'assignedManagers',
          where: { id: managerId },
          required: false // LEFT JOIN to include assessments without manager assignment
        },
        {
          model: Feedback,
          as: 'feedbacks',
          include: [
            { model: User, as: 'manager', attributes: ['id', 'name'] }
          ],
          required: false // LEFT JOIN to include assessments without feedback
        }
      ],
      where: {
        [Op.or]: [
          { manager_id: managerId },
          { '$assignedManagers.id$': managerId }
        ]
      },
      order: [
        ['scheduled_date', 'DESC'],
        [{ model: Feedback, as: 'feedbacks' }, 'created_at', 'DESC']
      ]
    });

    // Add evaluation data to each feedback
    const assessmentsWithEvalData = await Promise.all(
      assessments.map(async (assessment) => {
        const assessmentData = assessment.toJSON();
        
        if (assessmentData.feedbacks && assessmentData.feedbacks.length > 0) {
          // Get evaluation data for each feedback
          const feedbacksWithEval = await Promise.all(
            assessmentData.feedbacks.map(async (feedback) => {
              // Get evaluation for this feedback's manager and assessment
              const evaluation = await Evaluation.findOne({
                where: {
                  assessment_id: assessment.id,
                  evaluator_role: 'manager',
                  evaluator_id: feedback.manager_id
                }
              });
              
              return {
                ...feedback,
                // Add evaluation parameters
                hasKnowledgeOfSTEM: evaluation?.hasKnowledgeOfSTEM || 0,
                abilityToIntegrateSTEM: evaluation?.abilityToIntegrateSTEM || 0,
                discussesUpToDateInfo: evaluation?.discussesUpToDateInfo || 0,
                provideCourseOutline: evaluation?.provideCourseOutline || 0,
                languageFluency: evaluation?.languageFluency || 0,
                preparationWithLessonPlan: evaluation?.preparationWithLessonPlan || 0,
                totalScore: evaluation?.totalScore || 0,
                percentage: evaluation?.percentage || 0
              };
            })
          );
          
          assessmentData.feedbacks = feedbacksWithEval;
        }
        
        return assessmentData;
      })
    );
    
    return ok(res, { assessments: assessmentsWithEvalData });
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

    // Check if any feedback already exists for this assessment
    const existingFeedback = await Feedback.findOne({
      where: { assessment_id },
      include: [
        { model: User, as: 'manager', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    if (existingFeedback) {
      // If this manager already submitted feedback, update their existing feedback
      if (existingFeedback.manager_id === managerId) {
        await existingFeedback.update({ feedback_text, score, pass_fail });
      } else {
        // If a different manager is submitting, create a new feedback entry
        await Feedback.create({
          assessment_id,
          manager_id: managerId,
          feedback_text,
          score,
          pass_fail
        });
      }

      // Always update assessment with the latest feedback data
      await Assessment.update(
        {
          status: 'Completed',
          score,
          clear_status: pass_fail
        },
        { where: { id: assessment_id } }
      );

      return ok(res, { feedback: existingFeedback }, 'Feedback submitted successfully');
    } else {
      // Create new feedback (first submission)
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

      // Check and generate certificates based on combined score (school ops + manager)
      try {
        console.log(` Manager ${managerId} submitted feedback for assessment ${assessment_id}. Checking certificate generation...`);
        await CertificateGenerationService.checkAndGenerateCertificates(assessment_id);
        console.log(` Certificate generation check completed for assessment ${assessment_id}`);
      } catch (certError) {
        console.error('Certificate generation error:', certError);
        // Don't fail the feedback submission if certificate generation fails
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

// Assign multiple managers to an assessment
export const assignManagersToAssessment = async (req, res) => {
  try {
    const { assessment_id, manager_ids } = req.body;
    
    if (!assessment_id || !manager_ids || !Array.isArray(manager_ids)) {
      return bad(res, 'Assessment ID and manager IDs array are required', 400);
    }
    
    // Check if assessment exists
    const assessment = await Assessment.findByPk(assessment_id);
    if (!assessment) {
      return bad(res, 'Assessment not found', 404);
    }
    
    // Validate that all manager IDs exist and are managers
    const managers = await User.findAll({
      where: { 
        id: manager_ids,
        role: 'manager'
      }
    });
    
    if (managers.length !== manager_ids.length) {
      return bad(res, 'One or more managers not found or invalid', 400);
    }
    
    // Clear existing assignments
    await AssessmentManager.destroy({
      where: { assessment_id }
    });
    
    // Create new assignments
    const assignments = manager_ids.map(manager_id => ({
      assessment_id,
      manager_id
    }));
    
    await AssessmentManager.bulkCreate(assignments);
    
    return ok(res, { message: 'Managers assigned successfully' });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Edit existing feedback
export const editFeedback = async (req, res) => {
  try {
    const { feedback_id, feedback_text, score, pass_fail } = req.body;
    const managerId = req.user.id;
    
    if (!feedback_id || !feedback_text || score === undefined || !pass_fail) {
      return bad(res, 'Feedback ID, feedback text, score, and pass/fail status are required', 400);
    }
    
    // Find the feedback and ensure it belongs to this manager
    const feedback = await Feedback.findOne({
      where: { 
        id: feedback_id,
        manager_id: managerId
      }
    });
    
    if (!feedback) {
      return bad(res, 'Feedback not found or you do not have permission to edit it', 404);
    }
    
    // Update the feedback
    await feedback.update({
      feedback_text,
      score,
      pass_fail
    });
    
    // Update assessment status and score based on the latest feedback
    await Assessment.update(
      {
        status: 'Completed',
        score,
        clear_status: pass_fail
      },
      { where: { id: feedback.assessment_id } }
    );
    
    return ok(res, { feedback }, 'Feedback updated successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Get all managers for assignment
export const getManagers = async (_req, res) => {
  try {
    const managers = await User.findAll({
      where: { role: 'manager' },
      attributes: ['id', 'name', 'email', 'department']
    });
    
    return ok(res, { managers });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Submit evaluation
export const submitEvaluation = async (req, res) => {
  try {
    const {
      assessmentId,
      hasKnowledgeOfSTEM,
      abilityToIntegrateSTEM,
      discussesUpToDateInfo,
      provideCourseOutline,
      languageFluency,
      preparationWithLessonPlan,
      totalScore,
      percentage
    } = req.body;

    // Check if evaluation already exists for this assessment and evaluator
    const existingEvaluation = await Evaluation.findOne({
      where: {
        assessment_id: assessmentId,
        evaluator_role: 'manager',
        evaluator_id: req.user.id
      }
    });

    if (existingEvaluation) {
      return bad(res, 'Evaluation already exists for this assessment');
    }

    // Create new evaluation
    const evaluation = await Evaluation.create({
      assessment_id: assessmentId,
      evaluator_role: 'manager',
      evaluator_id: req.user.id,
      hasKnowledgeOfSTEM,
      abilityToIntegrateSTEM,
      discussesUpToDateInfo,
      provideCourseOutline,
      languageFluency,
      preparationWithLessonPlan,
      totalScore,
      percentage
    });

    return ok(res, evaluation, 'Evaluation submitted successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Get evaluation
export const getEvaluation = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const evaluation = await Evaluation.findOne({
      where: {
        assessment_id: assessmentId,
        evaluator_role: 'manager',
        evaluator_id: req.user.id
      }
    });

    if (!evaluation) {
      return bad(res, 'Evaluation not found', 404);
    }

    return ok(res, evaluation, 'Evaluation retrieved successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Update evaluation
export const updateEvaluation = async (req, res) => {
  try {
    console.log(` Manager updateEvaluation called for assessment: ${req.params.assessmentId}`);
    console.log(` Manager user: ${req.user.id} (${req.user.name})`);
    console.log(` Request body:`, req.body);
    
    const { assessmentId } = req.params;
    const {
      hasKnowledgeOfSTEM,
      abilityToIntegrateSTEM,
      discussesUpToDateInfo,
      provideCourseOutline,
      languageFluency,
      preparationWithLessonPlan,
      totalScore,
      percentage
    } = req.body;

    const evaluation = await Evaluation.findOne({
      where: {
        assessment_id: assessmentId,
        evaluator_role: 'manager',
        evaluator_id: req.user.id
      }
    });

    console.log(` Manager evaluation found:`, evaluation ? `ID: ${evaluation.id}` : 'Not found');

    if (!evaluation) {
      console.log(` Manager evaluation not found for assessment: ${assessmentId}`);
      return bad(res, 'Evaluation not found', 404);
    }

    console.log(` Manager updating evaluation ${evaluation.id} with score: ${totalScore}`);

    // Update evaluation
    await evaluation.update({
      hasKnowledgeOfSTEM,
      abilityToIntegrateSTEM,
      discussesUpToDateInfo,
      provideCourseOutline,
      languageFluency,
      preparationWithLessonPlan,
      totalScore,
      percentage
    });

    console.log(` Manager evaluation updated successfully`);

    // Check and generate certificates if trainer passed
    try {
      console.log(` Checking certificate generation for assessment ${assessmentId} after manager evaluation update`);
      await CertificateGenerationService.checkAndGenerateCertificates(assessmentId);
      console.log(` Certificate generation check completed for assessment ${assessmentId}`);
    } catch (certError) {
      console.error('Certificate generation error:', certError);
      // Don't fail the evaluation update if certificate generation fails
    }

    return ok(res, evaluation, 'Evaluation updated successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};
