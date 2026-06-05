import { Certificate, CertificateTemplate, User, Course, Assessment, Evaluation, SystemSettings } from '../config/db.js';
import { generateCertificatePdf } from './certificateService.js';
import TrainerLevelService from './trainerLevelService.js';

class CertificateGenerationService {
  /**
   * Generate course certificate when trainer passes assessment
   */
  static async generateCourseCertificate(assessmentId) {
    try {
      console.log(`🔍 Generating course certificate for assessment ${assessmentId}`);
      
      // First check assessment status
      const assessmentCheck = await Assessment.findByPk(assessmentId);
      console.log(`📋 Assessment status check:`, {
        id: assessmentId,
        status: assessmentCheck?.status,
        isCompleted: assessmentCheck?.status === 'Completed'
      });
      
      // Get assessment with evaluations and course info
      const assessment = await Assessment.findOne({
        where: { id: assessmentId, status: 'Completed' },
        include: [
          {
            model: User,
            as: 'trainer',
            attributes: ['id', 'name', 'email']
          },
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

      if (!assessment) {
        console.log(`Assessment ${assessmentId} not found or not completed`);
        return null;
      }

      // Calculate combined score
      const evaluations = assessment.evaluations || [];
      const schoolOpsEvaluations = evaluations.filter(evaluation => evaluation.evaluator_role === 'school_ops_manager');
      const managerEvaluations = evaluations.filter(evaluation => evaluation.evaluator_role === 'manager');

      const schoolOpsScore = schoolOpsEvaluations.reduce((sum, evaluation) => {
        // Use totalScore field if available, otherwise calculate from individual fields
        if (evaluation.totalScore) {
          return sum + evaluation.totalScore;
        } else {
          // Try individual fields
          const scoreFields = ['abilityToIntegrateSTEM', 'discussesUpToDateInfo', 'hasKnowledgeOfSTEM', 'languageFluency', 'preparationWithLessonPlan', 'provideCourseOutline'];
          return sum + scoreFields.reduce((s, field) => s + (evaluation[field] || 0), 0);
        }
      }, 0);

      const managerScore = managerEvaluations.reduce((sum, evaluation) => {
        // Use totalScore field if available, otherwise calculate from individual fields
        if (evaluation.totalScore) {
          return sum + evaluation.totalScore;
        } else {
          // Try individual fields
          const scoreFields = ['abilityToIntegrateSTEM', 'discussesUpToDateInfo', 'hasKnowledgeOfSTEM', 'languageFluency', 'preparationWithLessonPlan', 'provideCourseOutline'];
          return sum + scoreFields.reduce((s, field) => s + (evaluation[field] || 0), 0);
        }
      }, 0);

      const combinedScore = schoolOpsScore + managerScore;

      // Get passing criteria from system settings
      const settings = await SystemSettings.findOne();
      const passingPercentage = settings?.passingPercentage || 60;
      const totalMarks = settings?.totalMarks || 60;
      const percentage = Math.round((combinedScore / totalMarks) * 100);

      // Check if trainer passed
      if (percentage < passingPercentage) {
        console.log(`Trainer ${assessment.trainer.id} did not pass assessment ${assessmentId} (${percentage}% < ${passingPercentage}%)`);
        return null;
      }

      // Check if certificate already exists for this assessment
      const existingCertificate = await Certificate.findOne({
        where: {
          userId: assessment.trainer.id,
          courseId: assessment.course.id,
          metadata: {
            assessmentId: assessmentId
          }
        }
      });

      if (existingCertificate) {
        console.log(`Certificate already exists for assessment ${assessmentId}`);
        return existingCertificate;
      }

      // Get course completion template (templateId: 1 for course certificates)
      const template = await CertificateTemplate.findByPk(1);
      if (!template) {
        console.log('Course certificate template not found');
        return null;
      }

      // Generate certificate data
      const certificateData = {
        userId: assessment.trainer.id,
        courseId: assessment.course.id,
        templateId: 1,
        issueDate: new Date(),
        expiryDate: null, // Course certificates don't expire
        metadata: {
          assessmentId: assessmentId,
          score: percentage,
          combinedScore,
          schoolOpsScore,
          managerScore,
          passingPercentage,
          certificateType: 'course'
        }
      };

      // Generate PDF certificate
      // TODO: Fix PDF generation when certificate service is working
      // const certificatePdf = await generateCertificatePdf(certificateData, assessment.trainer);
      const certificatePdf = { path: null }; // Temporary fix

      // Create certificate record in database
      const certificate = await Certificate.create({
        userId: assessment.trainer.id,
        courseId: assessment.course.id,
        templateId: 1,
        certificateNumber: `COURSE-${Date.now()}-${assessment.trainer.id}`,
        issueDate: new Date(),
        expiryDate: null,
        status: 'active',
        isAutoGenerated: true,
        filePath: certificatePdf.path,
        metadata: certificateData.metadata
      });

      console.log(`✅ Course certificate generated for trainer ${assessment.trainer.id} - Course: ${assessment.course.name} - Score: ${percentage}%`);
      return certificate;

    } catch (error) {
      console.error('Error generating course certificate:', error);
      throw error;
    }
  }

  /**
   * Generate level certificate when trainer achieves new level
   */
  static async generateLevelCertificate(trainerId, newLevel) {
    try {
      const trainer = await User.findByPk(trainerId);
      if (!trainer || trainer.role !== 'trainer') {
        return null;
      }

      // Check if certificate already exists for this level
      const existingCertificate = await Certificate.findOne({
        where: {
          userId: trainerId,
          courseId: null, // Level certificates are not course-specific
          metadata: {
            level: newLevel,
            certificateType: 'level'
          }
        }
      });

      if (existingCertificate) {
        console.log(`Level ${newLevel} certificate already exists for trainer ${trainerId}`);
        return existingCertificate;
      }

      // Get level template (templateId: 3 for level certificates)
      const template = await CertificateTemplate.findByPk(3);
      if (!template) {
        console.log('Level certificate template not found');
        return null;
      }

      // Get level progress data
      const levelData = await TrainerLevelService.getTrainerProgress(trainerId);
      const levelProgress = levelData.progress[newLevel];

      // Generate certificate data
      const certificateData = {
        userId: trainerId,
        courseId: null, // Level certificates are not course-specific
        templateId: 3,
        issueDate: new Date(),
        expiryDate: null, // Level certificates don't expire
        metadata: {
          level: newLevel,
          qualifiedCount: levelProgress.qualifiedCount,
          requiredCount: levelProgress.requiredCount,
          minScore: levelProgress.minScore,
          achievedDate: levelProgress.achievedAt,
          certificateType: 'level'
        }
      };

      // Generate PDF certificate
      const certificatePdf = await generateCertificatePdf(certificateData, trainer);

      // Create certificate record in database
      const certificate = await Certificate.create({
        userId: trainerId,
        courseId: null,
        templateId: 3,
        certificateNumber: `LEVEL-${newLevel}-${Date.now()}-${trainerId}`,
        issueDate: new Date(),
        expiryDate: null,
        status: 'active',
        isAutoGenerated: true,
        filePath: certificatePdf.path,
        metadata: certificateData.metadata
      });

      console.log(`✅ Level ${newLevel} certificate generated for trainer ${trainerId}`);
      return certificate;

    } catch (error) {
      console.error('Error generating level certificate:', error);
      throw error;
    }
  }

  /**
   * Check and generate certificates for completed assessments
   */
  static async checkAndGenerateCertificates(assessmentId) {
    try {
      console.log(`🔍 Checking certificates for assessment ${assessmentId}`);
      
      const results = {
        courseCertificate: null,
        levelCertificates: []
      };

      // First, let's get all evaluations for this assessment to debug
      const allEvaluations = await Evaluation.findAll({
        where: { assessment_id: assessmentId },
        include: [
          { model: User, as: 'evaluator', attributes: ['id', 'name', 'email'] },
          { model: Assessment, as: 'assessment', include: [{ model: User, as: 'trainer', attributes: ['id', 'name'] }] }
        ]
      });
      
      console.log(`📊 All evaluations for assessment ${assessmentId}:`, allEvaluations.map(e => ({
        id: e.id,
        evaluator_role: e.evaluator_role,
        evaluator_id: e.evaluator_id,
        totalScore: e.totalScore,
        evaluator: e.evaluator?.name
      })));

      // Generate course certificate if assessment passed
      const courseCertificate = await this.generateCourseCertificate(assessmentId);
      if (courseCertificate) {
        results.courseCertificate = courseCertificate;
      }

      // Get trainer info to check level progression
      const assessment = await Assessment.findByPk(assessmentId, {
        include: [{ model: User, as: 'trainer', attributes: ['id'] }]
      });

      if (assessment && assessment.trainer) {
        const trainerId = assessment.trainer.id;
        
        // Check if trainer achieved any new levels
        const previousLevel = assessment.trainer.trainerLevel || 'L0';
        const levelData = await TrainerLevelService.calculateTrainerLevel(trainerId);
        const newLevel = levelData.currentLevel;

        // Generate level certificates for any newly achieved levels
        if (newLevel !== previousLevel) {
          // Generate certificate for the new level
          const levelCertificate = await this.generateLevelCertificate(trainerId, newLevel);
          if (levelCertificate) {
            results.levelCertificates.push(levelCertificate);
          }

          // Also generate certificates for any intermediate levels that were skipped
          const levelOrder = ['L1', 'L2', 'L3'];
          const previousLevelIndex = levelOrder.indexOf(previousLevel);
          const newLevelIndex = levelOrder.indexOf(newLevel);

          for (let i = previousLevelIndex + 1; i <= newLevelIndex; i++) {
            const level = levelOrder[i];
            if (level !== newLevel) {
              const skippedLevelCertificate = await this.generateLevelCertificate(trainerId, level);
              if (skippedLevelCertificate) {
                results.levelCertificates.push(skippedLevelCertificate);
              }
            }
          }
        }
      }

      console.log(`📋 Certificate generation results for assessment ${assessmentId}:`, {
        courseCertificate: !!results.courseCertificate,
        levelCertificates: results.levelCertificates.length
      });

      return results;

    } catch (error) {
      console.error('Error checking and generating certificates:', error);
      throw error;
    }
  }

  /**
   * Get all certificates for a trainer
   */
  static async getTrainerCertificates(trainerId) {
    try {
      const certificates = await Certificate.findAll({
        where: { userId: trainerId },
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'name']
          },
          {
            model: CertificateTemplate,
            as: 'template',
            attributes: ['id', 'name']
          }
        ],
        order: [['issueDate', 'DESC']]
      });

      // Separate course and level certificates
      const courseCertificates = certificates.filter(cert => cert.courseId);
      const levelCertificates = certificates.filter(cert => !cert.courseId);

      return {
        courseCertificates,
        levelCertificates,
        totalCertificates: certificates.length
      };

    } catch (error) {
      console.error('Error getting trainer certificates:', error);
      throw error;
    }
  }
}

export default CertificateGenerationService;
