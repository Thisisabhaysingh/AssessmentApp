import { sequelize } from '../config/db.js';

const syncDatabase = async () => {
  try {
    console.log('Syncing database...');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    
    console.log('Database synced successfully!');
    
    // Create default settings if they don't exist
    const { SystemSettings } = await import('../config/db.js');
    
    const existingSettings = await SystemSettings.findOne();
    if (!existingSettings) {
      console.log('Creating default system settings...');
      await SystemSettings.create({
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
        reportFrequency: 'weekly'
      });
      console.log('Default settings created!');
    }
    
  } catch (error) {
    console.error('Database sync failed:', error);
  } finally {
    await sequelize.close();
  }
};

syncDatabase();
