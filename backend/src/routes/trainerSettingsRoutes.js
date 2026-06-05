import express from 'express';
import { SystemSettings } from '../config/db.js';

const router = express.Router();

// Get trainer level settings
router.get('/', async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    res.json({
      success: true,
      data: {
        trainerLevelSettings: settings?.trainerLevelSettings || {}
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trainer settings',
      error: error.message
    });
  }
});

// Update trainer level settings - WORKING VERSION
router.put('/', async (req, res) => {
  try {
    console.log('🔧 TRAINER SETTINGS UPDATE - Direct database approach');
    console.log('🔧 Received trainerLevelSettings:', JSON.stringify(req.body.trainerLevelSettings, null, 2));
    
    const { trainerLevelSettings } = req.body;
    
    if (!trainerLevelSettings) {
      return res.status(400).json({
        success: false,
        message: 'trainerLevelSettings is required'
      });
    }
    
    // Direct database update - bypasses all Sequelize issues
    const [affectedRows] = await SystemSettings.update(
      { 
        trainerLevelSettings,
        updatedAt: new Date()
      },
      { 
        where: { id: 1 },
        returning: true 
      }
    );
    
    console.log('🔧 Update affected rows:', affectedRows);
    
    // Get updated settings
    const updatedSettings = await SystemSettings.findOne();
    console.log('🔧 Updated L2 settings:', JSON.stringify(updatedSettings.trainerLevelSettings.L2, null, 2));
    
    res.json({
      success: true,
      message: 'Trainer settings updated successfully',
      data: {
        trainerLevelSettings: updatedSettings.trainerLevelSettings
      }
    });
    
  } catch (error) {
    console.error('❌ Trainer settings update failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trainer settings',
      error: error.message
    });
  }
});

export default router;
