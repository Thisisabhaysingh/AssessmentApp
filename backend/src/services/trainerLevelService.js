import { User, Assessment, Evaluation, TrainerLevelQualifications, SystemSettings, Certificate } from '../config/db.js';
import { generateCertificatePdf } from './certificateService.js';
import { v4 as uuidv4 } from 'uuid';

class TrainerLevelService {
  /**
   * Get trainer level requirements from system settings
   */
  static async getLevelRequirements() {
    try {
      const settings = await SystemSettings.findOne();
      if (settings && settings.trainerLevelSettings) {
        return settings.trainerLevelSettings;
      }
      
      // Fallback to default values if no settings found
      return {
        L1: { totalAssessmentsRequired: 10, minScore: 70, qualifyingAssessmentsRequired: 10, enabled: true },
        L2: { totalAssessmentsRequired: 20, minScore: 85, qualifyingAssessmentsRequired: 10, enabled: true, requiresPreviousLevel: true },
        L3: { totalAssessmentsRequired: 25, minScore: 90, qualifyingAssessmentsRequired: 5, enabled: true, requiresPreviousLevel: true }
      };
    } catch (error) {
      console.error('Error getting level requirements:', error);
      // Return default values on error
      return {
        L1: { totalAssessmentsRequired: 10, minScore: 70, qualifyingAssessmentsRequired: 10, enabled: true },
        L2: { totalAssessmentsRequired: 20, minScore: 85, qualifyingAssessmentsRequired: 10, enabled: true, requiresPreviousLevel: true },
        L3: { totalAssessmentsRequired: 25, minScore: 90, qualifyingAssessmentsRequired: 5, enabled: true, requiresPreviousLevel: true }
      };
    }
  }

  /**
   * Calculate trainer level based on assessment performance
   */
  static async calculateTrainerLevel(trainerId) {
    try {
      // Get level requirements from system settings
      const levelRequirements = await this.getLevelRequirements();
      
      // Get all completed assessments for the trainer with evaluations
      const trainerAssessments = await Assessment.findAll({
        where: { 
          trainer_id: trainerId,
          status: 'Completed'
        },
        include: [
          {
            model: Evaluation,
            as: 'evaluations',
            required: true // Only include assessments that have evaluations
          }
        ],
        order: [['scheduled_date', 'DESC']]
      });

      // Calculate scores for each assessment
      const assessmentsWithScores = trainerAssessments.map(assessment => {
        const evaluations = assessment.evaluations || [];
        
        // Separate evaluations by role
        const schoolOpsEvaluations = evaluations.filter(evaluation => 
          evaluation.evaluator_role === 'school_ops_manager'
        );
        const managerEvaluations = evaluations.filter(evaluation => 
          evaluation.evaluator_role === 'manager'
        );

        // Calculate scores
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
        const percentage = combinedScore > 0 ? Math.round((combinedScore / 60) * 100) : 0; // Will be updated to use settings

        return {
          assessmentId: assessment.id,
          percentage,
          combinedScore,
          schoolOpsScore,
          managerScore,
          scheduledDate: assessment.scheduled_date
        };
      });

      // Check qualifications for each level
      const levelResults = await this.checkLevelQualifications(trainerId, assessmentsWithScores, levelRequirements);
      
      // Determine highest achieved level
      let highestLevel = 'L0';
      let levelAchievedDate = null;
      
      // Check in order L1, L2, L3
      if (levelResults.L1.qualified) {
        highestLevel = 'L1';
        levelAchievedDate = levelResults.L1.achievedAt;
      }
      
      if (levelResults.L2.qualified) {
        highestLevel = 'L2';
        levelAchievedDate = levelResults.L2.achievedAt;
      }
      
      if (levelResults.L3.qualified) {
        highestLevel = 'L3';
        levelAchievedDate = levelResults.L3.achievedAt;
      }

      // Update trainer's level in database
      const previousLevel = (await User.findByPk(trainerId))?.trainerLevel || 'L0';
      
      await User.update({
        trainerLevel: highestLevel,
        levelAchievedDate: levelAchievedDate,
        levelPerformanceData: {
          totalAssessments: assessmentsWithScores.length,
          levelResults,
          lastCalculated: new Date()
        }
      }, {
        where: { id: trainerId }
      });

      // Generate certificates for newly achieved levels
      if (highestLevel !== 'L0' && highestLevel !== previousLevel) {
        console.log(`🎉 Trainer ${trainerId} achieved ${highestLevel}, generating certificate...`);
        
        if (highestLevel === 'L1' && previousLevel !== 'L1') {
          await this.generateL1Certificate(trainerId);
        }
        
        // TODO: Add L2 and L3 certificate generation when implemented
        if (highestLevel === 'L2' && previousLevel !== 'L2') {
          console.log(`🎉 Trainer ${trainerId} achieved L2, certificate generation not yet implemented`);
        }
        
        if (highestLevel === 'L3' && previousLevel !== 'L3') {
          console.log(`🎉 Trainer ${trainerId} achieved L3, certificate generation not yet implemented`);
        }
      }

      return {
        currentLevel: highestLevel,
        levelAchievedDate,
        progress: levelResults,
        totalAssessments: assessmentsWithScores.length
      };

    } catch (error) {
      console.error('Error calculating trainer level:', error);
      throw error;
    }
  }

  /**
   * Check qualifications for each level
   */
  static async checkLevelQualifications(trainerId, assessmentsWithScores, levelRequirements) {
    const results = {
      L1: { qualified: false, qualifyingAssessments: [], achievedAt: null },
      L2: { qualified: false, qualifyingAssessments: [], achievedAt: null },
      L3: { qualified: false, qualifyingAssessments: [], achievedAt: null }
    };

    // Get passed assessments (>= 70%)
    const passedAssessments = assessmentsWithScores.filter(
      assessment => assessment.percentage >= 70
    );

    // Check each level with new requirements
    for (const [level, requirements] of Object.entries(levelRequirements)) {
      // Skip if level is disabled
      if (!requirements.enabled) {
        results[level] = {
          qualified: false,
          qualifyingAssessments: [],
          achievedAt: null,
          disabled: true
        };
        continue;
      }

      // Get assessments that meet the specific score threshold for this level
      const qualifyingAssessments = assessmentsWithScores.filter(
        assessment => assessment.percentage >= requirements.minScore
      );

      // Check basic qualification requirements
      let qualified = false;
      
      if (level === 'L1') {
        // L1: At least X assessments passed AND any Y assessments ≥ Z%
        qualified = passedAssessments.length >= requirements.totalAssessmentsRequired && 
                   qualifyingAssessments.length >= requirements.qualifyingAssessmentsRequired;
      } else if (level === 'L2') {
        // L2: At least X assessments passed AND any Y assessments ≥ Z% AND must be L1 first
        qualified = passedAssessments.length >= requirements.totalAssessmentsRequired && 
                   qualifyingAssessments.length >= requirements.qualifyingAssessmentsRequired &&
                   (!requirements.requiresPreviousLevel || results.L1.qualified);
      } else if (level === 'L3') {
        // L3: At least X assessments passed AND any Y assessments ≥ Z% AND must be L2 first
        qualified = passedAssessments.length >= requirements.totalAssessmentsRequired && 
                   qualifyingAssessments.length >= requirements.qualifyingAssessmentsRequired &&
                   (!requirements.requiresPreviousLevel || results.L2.qualified);
      }

      results[level] = {
        qualified: qualified,
        qualifyingAssessments: qualifyingAssessments.slice(0, requirements.qualifyingAssessmentsRequired),
        achievedAt: null,
        totalPassedAssessments: passedAssessments.length,
        requiredTotalAssessments: requirements.totalAssessmentsRequired,
        requiredQualifyingAssessments: requirements.qualifyingAssessmentsRequired,
        requiredScore: requirements.minScore,
        disabled: false
      };

      if (results[level].qualified) {
        const qualifyingAssessmentIds = results[level].qualifyingAssessments.map(a => a.assessmentId);
        const lastQualifyingAssessment = assessmentsWithScores
          .filter(a => qualifyingAssessmentIds.includes(a.assessmentId))
          .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
          .pop();

        results[level].achievedAt = lastQualifyingAssessment?.scheduledDate || null;
      }
    }

    return results;
  }

  /**
   * Get trainer progress for each level
   */
  static async getTrainerProgress(trainerId) {
    try {
      const levelData = await this.calculateTrainerLevel(trainerId);
      const levelRequirements = await this.getLevelRequirements();
      
      const progress = {};
      
      for (const [level, requirements] of Object.entries(levelRequirements)) {
        const levelResult = levelData.progress[level];
        
        // Get passed assessments (>= 70%)
        const passedAssessments = levelData.totalAssessments >= 0 ? 
          await this.getPassedAssessmentsCount(trainerId) : 0;
        
        // Get qualifying assessments (>= level-specific threshold)
        const qualifyingAssessments = levelResult.qualifyingAssessments.length;
        
        progress[level] = {
          qualified: levelResult.qualified,
          passedAssessmentsCount: levelResult.totalPassedAssessments || passedAssessments,
          requiredTotalAssessments: requirements.totalAssessmentsRequired,
          qualifyingAssessmentsCount: qualifyingAssessments,
          requiredQualifyingAssessments: requirements.qualifyingAssessmentsRequired,
          minScore: requirements.minScore,
          levelName: `Level ${level.replace('L', '')} Trainer`,
          achievedAt: levelResult.achievedAt,
          disabled: levelResult.disabled || false,
          // Calculate progress percentage based on both requirements
          totalProgressPercent: Math.round(
            Math.min(
              ((levelResult.totalPassedAssessments || passedAssessments) / requirements.totalAssessmentsRequired) * 100,
              100
            )
          ),
          qualifyingProgressPercent: Math.round(
            Math.min(
              (qualifyingAssessments / requirements.qualifyingAssessmentsRequired) * 100,
              100
            )
          )
        };
      }

      return {
        currentLevel: levelData.currentLevel,
        levelAchievedDate: levelData.levelAchievedDate,
        totalAssessments: levelData.totalAssessments,
        progress
      };

    } catch (error) {
      console.error('Error getting trainer progress:', error);
      throw error;
    }
  }

  /**
   * Helper method to get count of passed assessments (>= 70%)
   */
  static async getPassedAssessmentsCount(trainerId) {
    try {
      const trainerAssessments = await Assessment.findAll({
        where: { 
          trainer_id: trainerId,
          status: 'Completed'
        },
        include: [
          {
            model: Evaluation,
            as: 'evaluations',
            required: true
          }
        ]
      });

      let passedCount = 0;
      
      for (const assessment of trainerAssessments) {
        const evaluations = assessment.evaluations || [];
        
        const schoolOpsScore = evaluations.reduce((sum, evaluation) => {
          if (evaluation.totalScore) {
            return sum + evaluation.totalScore;
          } else {
            const scoreFields = ['abilityToIntegrateSTEM', 'discussesUpToDateInfo', 'hasKnowledgeOfSTEM', 'languageFluency', 'preparationWithLessonPlan', 'provideCourseOutline'];
            return sum + scoreFields.reduce((s, field) => s + (evaluation[field] || 0), 0);
          }
        }, 0);

        const managerScore = evaluations.reduce((sum, evaluation) => {
          if (evaluation.totalScore) {
            return sum + evaluation.totalScore;
          } else {
            const scoreFields = ['abilityToIntegrateSTEM', 'discussesUpToDateInfo', 'hasKnowledgeOfSTEM', 'languageFluency', 'preparationWithLessonPlan', 'provideCourseOutline'];
            return sum + scoreFields.reduce((s, field) => s + (evaluation[field] || 0), 0);
          }
        }, 0);

        const combinedScore = schoolOpsScore + managerScore;
        const percentage = combinedScore > 0 ? Math.round((combinedScore / 60) * 100) : 0;

        if (percentage >= 70) {
          passedCount++;
        }
      }

      return passedCount;
    } catch (error) {
      console.error('Error getting passed assessments count:', error);
      return 0;
    }
  }

  /**
   * Generate L1 certificate if trainer qualifies
   */
  static async generateL1Certificate(trainerId) {
    try {
      const trainer = await User.findByPk(trainerId);
      const levelData = await this.calculateTrainerLevel(trainerId);
      
      if (levelData.currentLevel === 'L1') {
        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
          where: {
            userId: trainerId,
            courseId: null, // Level certificates have courseId: null
            templateId: 2 // Assuming template 2 is for level certificates
          }
        });

        if (existingCertificate) {
          console.log(`L1 certificate already exists for trainer ${trainerId}`);
          return existingCertificate;
        }

        // Generate certificate for L1 achievement
        const certificateData = {
          userId: trainerId,
          courseId: null, // L1 is not course-specific
          templateId: 2, // Template 2 for level certificates
          certificateNumber: `L1-${uuidv4().substring(0, 8).toUpperCase()}`, // Generate unique certificate number
          issueDate: new Date(),
          expiryDate: null, // L1 certificates don't expire
          metadata: {
            level: 'L1',
            qualifyingAssessments: levelData.progress.L1.qualifyingCount,
            achievedDate: levelData.levelAchievedDate,
            trainerName: trainer.name
          }
        };

        // Create certificate record
        const certificate = await Certificate.create(certificateData);
        
        console.log(`🎉 L1 certificate record created for trainer ${trainerId}: ${certificate.certificateNumber}`);
        
        // TODO: Generate PDF when certificate service is fixed
        // const certificatePdf = await generateCertificatePdf(certificateData, trainer);
        // await certificate.update({
        //   certificatePath: certificatePdf.filePath,
        //   certificateNumber: certificatePdf.certificateNumber
        // });
        
        return certificate;
      }

      return null;
    } catch (error) {
      console.error('Error generating L1 certificate:', error);
      throw error;
    }
  }

  /**
   * Update trainer levels for all trainers (batch job)
   */
  static async updateAllTrainerLevels() {
    try {
      const trainers = await User.findAll({
        where: { role: 'trainer' }
      });

      const results = [];
      
      for (const trainer of trainers) {
        try {
          const levelData = await this.calculateTrainerLevel(trainer.id);
          
          // Generate L1 certificate if newly achieved
          if (trainer.trainerLevel !== 'L1' && levelData.currentLevel === 'L1') {
            await this.generateL1Certificate(trainer.id);
          }
          
          results.push({
            trainerId: trainer.id,
            trainerName: trainer.name,
            previousLevel: trainer.trainerLevel,
            newLevel: levelData.currentLevel,
            updated: trainer.trainerLevel !== levelData.currentLevel
          });
        } catch (error) {
          console.error(`Error updating level for trainer ${trainer.id}:`, error);
          results.push({
            trainerId: trainer.id,
            trainerName: trainer.name,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in batch level update:', error);
      throw error;
    }
  }
}

export default TrainerLevelService;
