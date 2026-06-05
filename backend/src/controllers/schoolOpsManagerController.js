import { ok, bad, notFound } from '../utils/responseHelper.js';
import { User, Assessment, Feedback, Course, AssessmentManager, Evaluation } from '../config/db.js';
import { validationResult } from 'express-validator';
import CertificateGenerationService from '../services/certificateGenerationService.js';

// Get school ops manager dashboard
export const getSchoolOpsManagerDashboard = async (req, res) => {
  try {
    const stats = {
      totalTrainers: await User.count({ where: { role: 'trainer' } }),
      totalAssessments: await Assessment.count(),
      scheduledAssessments: await Assessment.count({ where: { status: 'scheduled' } }),
      completedAssessments: await Assessment.count({ where: { status: 'completed' } }),
      pendingFeedback: await Feedback.count({ where: { manager_id: null } })
    };

    const recentAssessments = await Assessment.findAll({
      include: [
        { 
          model: User, 
          as: 'trainer', 
          attributes: ['id', 'name', 'email'],
          where: { role: 'trainer' }
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    ok(res, { stats, recentAssessments }, 'Dashboard data retrieved');
  } catch (error) {
    console.error('Dashboard error:', error);
    bad(res, 'Failed to load dashboard');
  }
};

// Get all trainers
export const getTrainers = async (req, res) => {
  try {
    const trainers = await User.findAll({
      where: { role: 'trainer' },
      attributes: ['id', 'name', 'email', 'department', 'designation', 'status', 'lastLogin'],
      order: [['name', 'ASC']]
    });

    // Format the response to match expected structure
    const formattedTrainers = trainers.map(trainer => ({
      ...trainer.toJSON(),
      user: {
        id: trainer.id,
        email: trainer.email,
        status: trainer.status,
        lastLogin: trainer.lastLogin
      }
    }));

    ok(res, formattedTrainers, 'Trainers retrieved');
  } catch (error) {
    console.error('Get trainers error:', error);
    bad(res, 'Failed to load trainers');
  }
};

// Get trainer details
export const getTrainerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const trainer = await User.findByPk(id, {
      where: { role: 'trainer' },
      attributes: ['id', 'name', 'email', 'department', 'designation', 'status', 'lastLogin'],
      include: [
        { 
          model: Assessment, 
          as: 'trainerAssessments',
          include: [
            { model: Feedback, as: 'feedbacks' }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!trainer) {
      return notFound(res, 'Trainer not found');
    }

    // Calculate performance metrics
    const assessments = trainer.trainerAssessments || [];
    const completedAssessments = assessments.filter(a => a.status === 'completed');
    const totalScore = completedAssessments.reduce((sum, a) => {
      const feedback = a.feedbacks && a.feedbacks.find(f => f.manager_id && f.score !== null);
      return sum + (feedback ? feedback.score : 0);
    }, 0);
    const averageScore = completedAssessments.length > 0 ? totalScore / completedAssessments.length : 0;

    // Format response to match expected structure
    const formattedTrainer = {
      ...trainer.toJSON(),
      user: {
        id: trainer.id,
        email: trainer.email,
        status: trainer.status,
        lastLogin: trainer.lastLogin
      },
      assessments: trainer.trainerAssessments
    };

    ok(res, {
      trainer: formattedTrainer,
      stats: {
        totalAssessments: assessments.length,
        completedAssessments: completedAssessments.length,
        averageScore: averageScore.toFixed(2)
      }
    }, 'Trainer details retrieved');
  } catch (error) {
    console.error('Get trainer details error:', error);
    bad(res, 'Failed to load trainer details');
  }
};

// Get all courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      order: [['name', 'ASC']]
    });

    ok(res, courses, 'Courses retrieved');
  } catch (error) {
    console.error('Get courses error:', error);
    bad(res, 'Failed to load courses');
  }
};

// Get all managers
export const getManagers = async (req, res) => {
  try {
    const managers = await User.findAll({
      where: { role: ['manager', 'school_ops_manager'] },
      attributes: ['id', 'name', 'email', 'department'],
      order: [['name', 'ASC']]
    });

    ok(res, managers, 'Managers retrieved');
  } catch (error) {
    console.error('Get managers error:', error);
    bad(res, 'Failed to load managers');
  }
};

// Get all assessments
export const getAssessments = async (req, res) => {
  try {
    const { status, trainerId } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (trainerId) where.trainer_id = trainerId;

    const assessments = await Assessment.findAll({
      where,
      include: [
        { 
          model: Course, 
          as: 'course',
          attributes: ['id', 'name', 'code']
        },
        { 
          model: User, 
          as: 'trainer', 
          attributes: ['id', 'name', 'email'],
          where: { role: 'trainer' }
        },
        { 
          model: User, 
          as: 'assignedManagers',
          attributes: ['id', 'name', 'email'],
          through: { model: AssessmentManager, attributes: [] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    ok(res, assessments, 'Assessments retrieved');
  } catch (error) {
    console.error('Get assessments error:', error);
    bad(res, 'Failed to load assessments');
  }
};

// Get assessment details
export const getAssessmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const assessment = await Assessment.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'trainer', 
          attributes: ['id', 'name', 'email'],
          where: { role: 'trainer' }
        },
        { model: Feedback, as: 'feedbacks' }
      ]
    });

    if (!assessment) {
      return notFound(res, 'Assessment not found');
    }

    ok(res, assessment, 'Assessment details retrieved');
  } catch (error) {
    console.error('Get assessment details error:', error);
    bad(res, 'Failed to load assessment details');
  }
};

// Schedule assessment (NEW functionality for school ops manager)
export const scheduleAssessment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return bad(res, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const { course_id, trainer_id, manager_ids, scheduled_date } = req.body;

    // Check if course exists
    const course = await Course.findByPk(course_id);
    if (!course) {
      return notFound(res, 'Course not found');
    }

    // Check if trainer exists and has trainer role
    const trainer = await User.findByPk(trainer_id, { where: { role: 'trainer' } });
    if (!trainer) {
      return notFound(res, 'Trainer not found');
    }

    // Create assessment
    const assessment = await Assessment.create({
      course_id,
      trainer_id,
      scheduled_date: new Date(scheduled_date),
      status: 'scheduled',
      createdBy: req.user.id
    });

    // Assign managers if provided
    if (manager_ids && manager_ids.length > 0) {
      await assessment.setAssignedManagers(manager_ids);
    }

    // Include course, trainer, and manager details in response
    const assessmentWithDetails = await Assessment.findByPk(assessment.id, {
      include: [
        { 
          model: Course, 
          as: 'course',
          attributes: ['id', 'name', 'code']
        },
        { 
          model: User, 
          as: 'trainer', 
          attributes: ['id', 'name', 'email'],
          where: { role: 'trainer' }
        },
        { 
          model: User, 
          as: 'assignedManagers',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    ok(res, assessmentWithDetails, 'Assessment scheduled successfully');
  } catch (error) {
    console.error('Schedule assessment error:', error);
    bad(res, 'Failed to schedule assessment');
  }
};

// Update assessment
export const updateAssessment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return bad(res, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const { id } = req.params;
    const updates = req.body;

    const assessment = await Assessment.findByPk(id);
    if (!assessment) {
      return notFound(res, 'Assessment not found');
    }

    // Update assessment
    await assessment.update({
      ...updates,
      updatedBy: req.user.id
    });

    // Include trainer details in response
    const updatedAssessment = await Assessment.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'trainer', 
          attributes: ['id', 'name', 'email'],
          where: { role: 'trainer' }
        }
      ]
    });

    ok(res, updatedAssessment, 'Assessment updated successfully');
  } catch (error) {
    console.error('Update assessment error:', error);
    bad(res, 'Failed to update assessment');
  }
};

// Delete assessment
export const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await Assessment.findByPk(id);
    if (!assessment) {
      return notFound(res, 'Assessment not found');
    }

    // Check if assessment can be deleted (only if not completed)
    if (assessment.status === 'completed') {
      return bad(res, 'Cannot delete completed assessment');
    }

    await assessment.destroy();

    ok(res, null, 'Assessment deleted successfully');
  } catch (error) {
    console.error('Delete assessment error:', error);
    bad(res, 'Failed to delete assessment');
  }
};

// Submit feedback (school ops manager can now provide both comments and scores)
export const submitFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return bad(res, 'Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const { id } = req.params;
    const { comments, recommendations, score } = req.body;
    const isPutRequest = req.method === 'PUT';

    let feedback;

    if (isPutRequest) {
      // PUT request: Update existing feedback by ID
      feedback = await Feedback.findByPk(id);
      if (!feedback) {
        return notFound(res, 'Feedback not found');
      }

      // Check if the user owns this feedback
      if (feedback.manager_id !== req.user.id) {
        return forbidden(res, 'You can only update your own feedback');
      }

      // Update feedback
      await feedback.update({
        feedback_text: comments || feedback.feedback_text,
        recommendations: recommendations !== undefined ? recommendations : feedback.recommendations,
        score: score !== undefined ? score : feedback.score,
        pass_fail: score !== undefined ? (score >= 70 ? 'pass' : 'fail') : feedback.pass_fail
      });

    } else {
      // POST request: Create or update feedback for assessment
      const assessmentId = id;

      // Check if assessment exists
      const assessment = await Assessment.findByPk(assessmentId);
      if (!assessment) {
        return notFound(res, 'Assessment not found');
      }

      // Check if school ops manager is assigned to this assessment
      const isAssigned = await assessment.hasAssignedManager(req.user.id);
      if (!isAssigned) {
        return forbidden(res, 'You are not assigned to this assessment');
      }

      // Create or update feedback
      const [feedbackResult, created] = await Feedback.findOrCreate({
        where: { 
          assessment_id: assessmentId,
          manager_id: req.user.id
        },
        defaults: {
          feedback_text: comments,
          recommendations: recommendations || null,
          score: score || null,
          pass_fail: score ? (score >= 70 ? 'pass' : 'fail') : null
        }
      });

      feedback = feedbackResult;

      if (!created) {
        // Update existing feedback
        await feedback.update({
          feedback_text: comments,
          recommendations: recommendations || null,
          score: score || null,
          pass_fail: score ? (score >= 70 ? 'pass' : 'fail') : null
        });
      }
    }

    ok(res, feedback, isPutRequest ? 'Feedback updated successfully' : 'Feedback submitted successfully');
  } catch (error) {
    console.error('Submit feedback error:', error);
    serverError(res, 'Failed to submit feedback');
  }
};

// Get all feedback for school ops manager
export const getAllFeedback = async (req, res) => {
  try {
    // Get all assessments that school ops manager can evaluate (not just assigned ones)
    const allAssessments = await Assessment.findAll({
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'trainer',
          attributes: ['id', 'name', 'email'],
          where: { role: 'trainer' }
        },
        {
          model: User,
          as: 'assignedManagers',
          attributes: ['id', 'name', 'email'],
          required: false // Make this optional to show all assessments
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get feedback for these assessments
    const feedbackData = [];
    for (const assessment of allAssessments) {
      const feedback = await Feedback.findAll({
        where: { assessment_id: assessment.id },
        include: [
          {
            model: User,
            as: 'manager',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Get evaluation data for this assessment
      const evaluation = await Evaluation.findOne({
        where: {
          assessment_id: assessment.id,
          evaluator_role: 'school_ops_manager',
          evaluator_id: req.user.id
        }
      });

      // If no feedback exists, show the assessment with empty feedback
      if (feedback.length === 0) {
        feedbackData.push({
          id: null, // No feedback ID
          assessment_id: assessment.id,
          manager_id: req.user.id,
          feedback_text: '',
          recommendations: '',
          score: null,
          pass_fail: null,
          created_at: assessment.createdAt,
          updated_at: assessment.updatedAt,
          evaluator_role: 'school_ops_manager', // Add evaluator role
          // Include evaluation data
          evaluation_id: evaluation?.id || null, // Add evaluation ID for updates
          timeBasedActivity: evaluation?.timeBasedActivity || 0,
          studentEngagementIdeas: evaluation?.studentEngagementIdeas || 0,
          poisedAndConfident: evaluation?.poisedAndConfident || 0,
          wellModulatedVoice: evaluation?.wellModulatedVoice || 0,
          pleasingLook: evaluation?.pleasingLook || 0,
          totalScore: evaluation?.totalScore || 0,
          percentage: evaluation?.percentage || 0,
          assessment: assessment.toJSON(),
          manager: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email
          }
        });
      } else {
        // Show existing feedback with evaluation data
        feedbackData.push(...feedback.map(f => ({
          ...f.toJSON(),
          evaluator_role: f.manager_id === req.user.id ? 'school_ops_manager' : 'manager', // Add evaluator role
          // Include evaluation data
          evaluation_id: evaluation?.id || null, // Add evaluation ID for updates
          timeBasedActivity: evaluation?.timeBasedActivity || 0,
          studentEngagementIdeas: evaluation?.studentEngagementIdeas || 0,
          poisedAndConfident: evaluation?.poisedAndConfident || 0,
          wellModulatedVoice: evaluation?.wellModulatedVoice || 0,
          pleasingLook: evaluation?.pleasingLook || 0,
          totalScore: evaluation?.totalScore || 0,
          percentage: evaluation?.percentage || 0,
          assessment: assessment.toJSON()
        })));
      }
    }

    ok(res, feedbackData, 'Feedback retrieved');
  } catch (error) {
    console.error('Get all feedback error:', error);
    bad(res, 'Failed to load feedback');
  }
};

// Get feedback for assessment
export const getFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findAll({
      where: { assessment_id: id },
      include: [
        { 
          model: User, 
          as: 'manager', 
          attributes: ['id', 'name', 'email'] 
        }
      ]
    });

    ok(res, feedback, 'Feedback retrieved');
  } catch (error) {
    console.error('Get feedback error:', error);
    bad(res, 'Failed to load feedback');
  }
};

// Get performance reports
export const getPerformance = async (req, res) => {
  try {
    const { trainerId, startDate, endDate } = req.query;
    const where = {};

    if (trainerId) where.trainer_id = trainerId;
    if (startDate && endDate) {
      where.createdAt = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get assessments where current school ops manager is assigned
    const assessments = await Assessment.findAll({
      where,
      include: [
        { 
          model: User, 
          as: 'trainer', 
          attributes: ['id', 'name', 'email'] 
        },
        { 
          model: Feedback, 
          as: 'feedbacks',
          include: [
            {
              model: User,
              as: 'manager',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'assignedManagers',
          where: {
            id: req.user.id // Only include assessments assigned to current school ops manager
          },
          required: false // Use LEFT JOIN to get assessments even if no managers assigned
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Filter to only include assessments where current school ops manager is assigned
    const assignedAssessments = assessments.filter(assessment => 
      assessment.assignedManagers && assessment.assignedManagers.length > 0
    );

    // Group by trainer and calculate metrics
    const performanceData = {};
    
    assignedAssessments.forEach(assessment => {
      const trainerId = assessment.trainer_id;
      const trainerName = assessment.trainer.name;
      
      // Debug logging
      console.log('Processing assessment:', {
        id: assessment.id,
        status: assessment.status,
        feedbacks: assessment.feedbacks?.length || 0,
        feedbackDetails: assessment.feedbacks
      });
      
      if (!performanceData[trainerId]) {
        performanceData[trainerId] = {
          trainerId,
          trainerName,
          totalAssessments: 0,
          completedAssessments: 0,
          averageScore: 0,
          totalScore: 0,
          assessments: []
        };
      }
      
      const data = performanceData[trainerId];
      data.totalAssessments++;
      
      if (assessment.status === 'Completed' || (assessment.feedbacks && assessment.feedbacks.length > 0)) {
        data.completedAssessments++;
        
        // Calculate average score from all manager feedback (technical + school ops)
        const allFeedbackWithScores = assessment.feedbacks?.filter(f => f.score !== null) || [];
        let averageScore = null;
        
        if (allFeedbackWithScores.length > 0) {
          const totalScore = allFeedbackWithScores.reduce((sum, f) => sum + f.score, 0);
          averageScore = totalScore / allFeedbackWithScores.length;
          data.totalScore += averageScore;
        }
        
        data.assessments.push({
          id: assessment.id,
          title: assessment.title,
          status: assessment.status,
          completedAt: assessment.updatedAt,
          score: averageScore,
          hasSchoolOpsFeedback: assessment.feedbacks?.some(f => f.manager_id)
        });
      }
    });
    
    // Calculate average scores
    Object.values(performanceData).forEach(data => {
      if (data.completedAssessments > 0) {
        data.averageScore = (data.totalScore / data.completedAssessments).toFixed(2);
      }
    });

    ok(res, Object.values(performanceData), 'Performance data retrieved');
  } catch (error) {
    console.error('Get performance error:', error);
    bad(res, 'Failed to load performance data');
  }
};

// Submit evaluation
export const submitEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return bad(res, 'Validation failed', errors.array());
    }

    const {
      assessmentId,
      timeBasedActivity,
      studentEngagementIdeas,
      poisedAndConfident,
      wellModulatedVoice,
      pleasingLook,
      totalScore,
      percentage
    } = req.body;

    // Check if evaluation already exists for this assessment and evaluator
    const existingEvaluation = await Evaluation.findOne({
      where: {
        assessment_id: assessmentId,
        evaluator_role: 'school_ops_manager',
        evaluator_id: req.user.id
      }
    });

    if (existingEvaluation) {
      return bad(res, 'Evaluation already exists for this assessment');
    }

    // Create new evaluation
    const evaluation = await Evaluation.create({
      assessment_id: assessmentId,
      evaluator_role: 'school_ops_manager',
      evaluator_id: req.user.id,
      timeBasedActivity,
      studentEngagementIdeas,
      poisedAndConfident,
      wellModulatedVoice,
      pleasingLook,
      totalScore,
      percentage
    });

    ok(res, evaluation, 'Evaluation submitted successfully');
  } catch (error) {
    console.error('Submit evaluation error:', error);
    bad(res, 'Failed to submit evaluation');
  }
};

// Get evaluation
export const getEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query; // Get role from query parameter

    let evaluation;
    let evaluatorRole = 'school_ops_manager'; // Default role
    let evaluatorId = req.user.id; // Default to current user

    // If role is 'manager', we want to get manager evaluations for this assessment
    if (role === 'manager') {
      evaluatorRole = 'manager';
      // For manager evaluations, we don't filter by evaluator_id since school ops manager should see all manager evaluations
      evaluatorId = undefined;
    }

    // First try to find by evaluation ID
    const whereClause = {
      id: id,
      evaluator_role: evaluatorRole
    };

    // Only add evaluator_id filter if it's defined (not for manager evaluations)
    if (evaluatorId !== undefined) {
      whereClause.evaluator_id = evaluatorId;
    }

    evaluation = await Evaluation.findOne({
      where: whereClause
    });

    // If not found by ID, try to find by assessment ID (for backward compatibility)
    if (!evaluation) {
      const assessmentWhereClause = {
        assessment_id: id,
        evaluator_role: evaluatorRole
      };

      // Only add evaluator_id filter if it's defined (not for manager evaluations)
      if (evaluatorId !== undefined) {
        assessmentWhereClause.evaluator_id = evaluatorId;
      }

      evaluation = await Evaluation.findOne({
        where: assessmentWhereClause
      });
    }

    if (!evaluation) {
      return notFound(res, 'Evaluation not found');
    }

    ok(res, evaluation, 'Evaluation retrieved successfully');
  } catch (error) {
    console.error('Get evaluation error:', error);
    bad(res, 'Failed to get evaluation');
  }
};

// Update evaluation
export const updateEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return bad(res, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const {
      timeBasedActivity,
      studentEngagementIdeas,
      poisedAndConfident,
      wellModulatedVoice,
      pleasingLook,
      totalScore,
      percentage
    } = req.body;

    let evaluation;

    // First try to find by evaluation ID
    evaluation = await Evaluation.findOne({
      where: {
        id: id,
        evaluator_role: 'school_ops_manager',
        evaluator_id: req.user.id
      }
    });

    // If not found, try to find by assessment ID (for backward compatibility)
    if (!evaluation) {
      evaluation = await Evaluation.findOne({
        where: {
          assessment_id: id,
          evaluator_role: 'school_ops_manager',
          evaluator_id: req.user.id
        }
      });
    }

    if (!evaluation) {
      return notFound(res, 'Evaluation not found');
    }

    // Update evaluation
    await evaluation.update({
      timeBasedActivity,
      studentEngagementIdeas,
      poisedAndConfident,
      wellModulatedVoice,
      pleasingLook,
      totalScore,
      percentage
    });

    // Check and generate certificates if trainer passed
    try {
      console.log(`🔍 Checking certificate generation for assessment ${evaluation.assessment_id} after school ops evaluation update`);
      
      // Update assessment status to 'Completed' since school ops evaluation is done
      const assessment = await Assessment.findByPk(evaluation.assessment_id);
      if (assessment) {
        const currentStatus = assessment.status;
        console.log(`📋 Current assessment status: ${currentStatus}`);
        
        // Only update status if it's not already 'Completed'
        if (currentStatus !== 'Completed') {
          await assessment.update({ status: 'Completed' });
          console.log(`✅ Assessment ${evaluation.assessment_id} status updated to 'Completed'`);
        } else {
          console.log(`ℹ️ Assessment ${evaluation.assessment_id} already 'Completed', skipping status update`);
        }
      }
      
      await CertificateGenerationService.checkAndGenerateCertificates(evaluation.assessment_id);
      console.log(`✅ Certificate generation check completed for assessment ${evaluation.assessment_id}`);
    } catch (certError) {
      console.error('Certificate generation error:', certError);
      // Don't fail the evaluation update if certificate generation fails
    }

    ok(res, evaluation, 'Evaluation updated successfully');
  } catch (error) {
    console.error('Update evaluation error:', error);
    bad(res, 'Failed to update evaluation');
  }
};
