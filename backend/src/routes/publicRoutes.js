import { Router } from 'express';
import { Evaluation, Assessment, User, Course, SystemSettings } from '../config/db.js';
import { ok, bad } from '../utils/responseHelper.js';

const router = Router();

// Get all evaluations (public endpoint for transparency)
router.get('/evaluations', async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      include: [
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Assessment,
          as: 'assessment',
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
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    return ok(res, evaluations, 'Evaluations retrieved successfully');
  } catch (error) {
    console.error('Error getting evaluations:', error);
    return bad(res, error.message, 500);
  }
});

// Get system settings (public endpoint for all authenticated users)
router.get('/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    
    // If no settings exist, return default settings
    if (!settings) {
      const defaultSettings = {
        passingPercentage: 60,
        totalMarks: 60,
        schoolOpsManagerMarks: 25,
        managerMarks: 35,
        evaluationCriteria: {},
        twoFactorAuth: true,
        sessionTimeout: '8',
        passwordMinLength: '8',
        autoBackup: true,
        backupTime: '2:00 AM',
        dataRetention: '2',
        performanceMonitoring: true,
        emailNotifications: true,
        assessmentReminders: true,
        performanceReports: true,
        reportFrequency: 'weekly',
        trainerLevelSettings: {
          L1: { totalAssessmentsRequired: 10, minScore: 70, qualifyingAssessmentsRequired: 10, enabled: true },
          L2: { totalAssessmentsRequired: 20, minScore: 85, qualifyingAssessmentsRequired: 10, enabled: true, requiresPreviousLevel: true },
          L3: { totalAssessmentsRequired: 25, minScore: 90, qualifyingAssessmentsRequired: 5, enabled: true, requiresPreviousLevel: true }
        }
      };
      return ok(res, defaultSettings, 'Default settings retrieved successfully');
    }
    
    return ok(res, settings, 'Settings retrieved successfully');
  } catch (error) {
    console.error('Error getting settings:', error);
    return bad(res, error.message, 500);
  }
});

export default router;
