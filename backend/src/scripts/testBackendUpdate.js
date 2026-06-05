import { SystemSettings } from '../config/db.js';

const testBackendUpdate = async () => {
  try {
    console.log('🔍 BACKEND UPDATE TEST STARTED\n');
    
    // 1. Find current settings
    const settings = await SystemSettings.findOne();
    console.log('📊 Current settings ID:', settings.id);
    
    // 2. Simulate the exact data structure from frontend
    const updateData = {
      twoFactorAuth: true,
      sessionTimeout: "8",
      passwordMinLength: "8",
      autoBackup: true,
      backupTime: "2:00 AM",
      dataRetention: "2",
      performanceMonitoring: true,
      emailNotifications: true,
      assessmentReminders: true,
      performanceReports: true,
      reportFrequency: "weekly",
      passingPercentage: 60,
      totalMarks: 60,
      schoolOpsManagerMarks: 25,
      managerMarks: 35,
      evaluationCriteria: {},
      trainerLevelSettings: {
        L1: {
          totalAssessmentsRequired: 10,
          minScore: 70,
          qualifyingAssessmentsRequired: 10,
          enabled: true
        },
        L2: {
          totalAssessmentsRequired: 10,  // NEW VALUE
          minScore: 85,
          qualifyingAssessmentsRequired: 5,  // NEW VALUE
          enabled: true,
          requiresPreviousLevel: true
        },
        L3: {
          totalAssessmentsRequired: 25,
          minScore: 90,
          qualifyingAssessmentsRequired: 5,
          enabled: true,
          requiresPreviousLevel: true
        }
      }
    };
    
    console.log('🔧 Update data trainerLevelSettings:', JSON.stringify(updateData.trainerLevelSettings, null, 2));
    
    // 3. Test the exact same update logic as controller
    console.log('🔍 Before update - L2 settings:', JSON.stringify(settings.trainerLevelSettings.L2, null, 2));
    
    // Remove undefined values (same as controller)
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    console.log('🔧 Final update data trainerLevelSettings:', JSON.stringify(updateData.trainerLevelSettings, null, 2));
    
    // 4. Perform the update
    const result = await settings.update(updateData);
    
    console.log('✅ Update completed!');
    console.log('🔍 Update result:', result);
    console.log('🔍 After update - L2 settings:', JSON.stringify(settings.trainerLevelSettings.L2, null, 2));
    
    // 5. Verify by fetching fresh
    const freshSettings = await SystemSettings.findOne();
    console.log('🔍 Fresh fetch - L2 settings:', JSON.stringify(freshSettings.trainerLevelSettings.L2, null, 2));
    
    console.log('\n🎉 BACKEND UPDATE TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Backend update test failed:', error);
  } finally {
    process.exit(0);
  }
};

testBackendUpdate();
