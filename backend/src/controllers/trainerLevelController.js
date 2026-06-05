import TrainerLevelService from '../services/trainerLevelService.js';
import { User } from '../config/db.js';
import { ok, bad } from '../utils/responseHelper.js';

// Get trainer's current level and progress
export const getTrainerLevel = async (req, res) => {
  try {
    const trainerId = req.user.id; // Get from authenticated user
    
    const progress = await TrainerLevelService.getTrainerProgress(trainerId);
    
    return ok(res, progress, 'Trainer level progress retrieved successfully');
  } catch (error) {
    console.error('Error getting trainer level:', error);
    return bad(res, error.message, 500);
  }
};

// Get all trainers with their levels (for admin)
export const getAllTrainerLevels = async (req, res) => {
  try {
    const trainers = await User.findAll({
      where: { role: 'trainer' },
      attributes: ['id', 'name', 'email', 'trainerLevel', 'levelAchievedDate', 'levelPerformanceData'],
      order: [['trainerLevel', 'DESC'], ['name', 'ASC']]
    });
    
    return ok(res, { trainers }, 'Trainer levels retrieved successfully');
  } catch (error) {
    console.error('Error getting all trainer levels:', error);
    return bad(res, error.message, 500);
  }
};

// Recalculate trainer level (manual trigger)
export const recalculateTrainerLevel = async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    // Verify trainer exists
    const trainer = await User.findOne({
      where: { id: trainerId, role: 'trainer' }
    });
    
    if (!trainer) {
      return bad(res, 'Trainer not found', 404);
    }
    
    const levelData = await TrainerLevelService.calculateTrainerLevel(trainerId);
    
    // Generate L1 certificate if newly achieved
    if (trainer.trainerLevel !== 'L1' && levelData.currentLevel === 'L1') {
      await TrainerLevelService.generateL1Certificate(trainerId);
    }
    
    return ok(res, levelData, 'Trainer level recalculated successfully');
  } catch (error) {
    console.error('Error recalculating trainer level:', error);
    return bad(res, error.message, 500);
  }
};

// Update all trainer levels (batch job)
export const updateAllTrainerLevels = async (req, res) => {
  try {
    const results = await TrainerLevelService.updateAllTrainerLevels();
    
    return ok(res, { results }, 'All trainer levels updated successfully');
  } catch (error) {
    console.error('Error updating all trainer levels:', error);
    return bad(res, error.message, 500);
  }
};

// Get trainer level statistics (for admin dashboard)
export const getTrainerLevelStats = async (req, res) => {
  try {
    const stats = await User.findAll({
      where: { role: 'trainer' },
      attributes: [
        'trainerLevel',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['trainerLevel'],
      raw: true
    });
    
    // Format the response
    const levelStats = {
      L0: 0,
      L1: 0,
      L2: 0,
      L3: 0,
      total: 0
    };
    
    stats.forEach(stat => {
      levelStats[stat.trainerLevel] = parseInt(stat.count);
      levelStats.total += parseInt(stat.count);
    });
    
    return ok(res, levelStats, 'Trainer level statistics retrieved successfully');
  } catch (error) {
    console.error('Error getting trainer level stats:', error);
    return bad(res, error.message, 500);
  }
};

// Generate L1 certificate for trainer
export const generateL1Certificate = async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    const certificate = await TrainerLevelService.generateL1Certificate(trainerId);
    
    if (!certificate) {
      return bad(res, 'Trainer does not qualify for L1 certificate', 400);
    }
    
    return ok(res, { certificate }, 'L1 certificate generated successfully');
  } catch (error) {
    console.error('Error generating L1 certificate:', error);
    return bad(res, error.message, 500);
  }
};
