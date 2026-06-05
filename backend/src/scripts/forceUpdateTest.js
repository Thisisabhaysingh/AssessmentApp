import { SystemSettings } from '../config/db.js';

const forceUpdateTest = async () => {
  try {
    console.log('🔍 FORCE UPDATE TEST STARTED\n');
    
    // 1. Find the settings record
    const settings = await SystemSettings.findOne();
    console.log('📊 Found settings record:', settings.id);
    
    // 2. Force update with new values
    const newTrainerLevelSettings = {
      L1: {
        totalAssessmentsRequired: 10,
        minScore: 70,
        qualifyingAssessmentsRequired: 10,
        enabled: true
      },
      L2: {
        totalAssessmentsRequired: 20,  // NEW VALUE
        minScore: 85,
        qualifyingAssessmentsRequired: 10,  // NEW VALUE
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
    };
    
    console.log('🔧 Force updating with:', JSON.stringify(newTrainerLevelSettings, null, 2));
    
    // 3. Update using raw SQL to avoid Sequelize issues
    await SystemSettings.update(
      { trainerLevelSettings: newTrainerLevelSettings },
      { where: { id: settings.id } }
    );
    
    console.log('✅ Force update completed!');
    
    // 4. Verify the update
    const updatedSettings = await SystemSettings.findOne();
    console.log('🔍 Verification - L2 settings:', JSON.stringify(updatedSettings.trainerLevelSettings.L2, null, 2));
    
    console.log('\n🎉 FORCE UPDATE TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Force update failed:', error);
  } finally {
    process.exit(0);
  }
};

forceUpdateTest();
