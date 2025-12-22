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
      reportFrequency
    } = req.body;
    
    // Get the first (and only) settings record
    let settings = await SystemSettings.findOne();
    
    // If no settings exist, create new
    if (!settings) {
      settings = await SystemSettings.create(req.body);
    } else {
      // Update existing settings
      await settings.update({
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
        reportFrequency
      });
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
