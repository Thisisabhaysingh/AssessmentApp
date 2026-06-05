const SystemSettings = require('../models/SystemSettings');

// Get system settings
const getSettings = async (req, res) => {
  try {
    // Get the first (and only) settings record
    let settings = await SystemSettings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    
    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error.message
    });
  }
};

// Update system settings
const updateSettings = async (req, res) => {
  try {
    console.log('🔍 Debug: Raw request body:', JSON.stringify(req.body, null, 2));
    
    const {
      twoFactorAuth,
      sessionTimeout,
      passwordMinLength,
      autoBackup,
      backupTime,
      dataRetention,
      performanceMonitoring,
      emailNotifications,
      assessmentReminders,
      performanceReports,
      reportFrequency,
      passingPercentage,
      totalMarks,
      schoolOpsManagerMarks,
      managerMarks,
      evaluationCriteria,
      trainerLevelSettings
    } = req.body;
    
    console.log('🔍 Debug: Destructured trainerLevelSettings:', JSON.stringify(trainerLevelSettings, null, 2));
    
    // Get the first (and only) settings record
    let settings = await SystemSettings.findOne();
    
    // Prepare update object
    const updateData = {
      twoFactorAuth,
      sessionTimeout,
      passwordMinLength,
      autoBackup,
      backupTime,
      dataRetention,
      performanceMonitoring,
      emailNotifications,
      assessmentReminders,
      performanceReports,
      reportFrequency,
      passingPercentage,
      totalMarks,
      schoolOpsManagerMarks,
      managerMarks,
      evaluationCriteria,
      trainerLevelSettings
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    // If no settings exist, create new
    if (!settings) {
      console.log('🔍 Debug: Creating new settings with data:', JSON.stringify(updateData, null, 2));
      settings = await SystemSettings.create(updateData);
      console.log('🔍 Debug: New settings created:', JSON.stringify(settings.trainerLevelSettings, null, 2));
    } else {
      // Update existing settings - DIRECT DATABASE UPDATE
      console.log('🔍 Debug: Updating existing settings with data:', JSON.stringify(updateData, null, 2));
      console.log('🔍 Debug: Current settings before update:', JSON.stringify(settings.trainerLevelSettings, null, 2));
      
      // Use direct database update to avoid Sequelize issues
      const [affectedRows] = await SystemSettings.update(
        updateData,
        { 
          where: { id: settings.id },
          returning: true 
        }
      );
      
      console.log('🔍 Debug: Update affected rows:', affectedRows);
      
      // Refetch to get updated data
      settings = await SystemSettings.findOne();
      console.log('🔍 Debug: Settings after update:', JSON.stringify(settings.trainerLevelSettings, null, 2));
    }
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
      error: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
