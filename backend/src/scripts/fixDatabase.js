import { sequelize } from '../config/db.js';

const fixDatabase = async () => {
  try {
    console.log('Fixing database constraints...');
    
    // First, remove orphaned assessment_manager records
    await sequelize.query(`
      DELETE am FROM assessment_managers am
      LEFT JOIN assessments a ON am.assessment_id = a.id
      WHERE a.id IS NULL
    `);
    console.log('Cleaned orphaned assessment_manager records');
    
    // Then sync with alter: true to create SystemSettings table
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
    } else {
      console.log('System settings already exist');
    }
    
  } catch (error) {
    console.error('Database fix failed:', error);
  } finally {
    await sequelize.close();
  }
};

fixDatabase();
