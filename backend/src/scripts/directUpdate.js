import { SystemSettings } from '../config/db.js';

const directUpdate = async () => {
  try {
    console.log('🔧 DIRECT UPDATE - Bypassing all API issues\n');
    
    // 1. Get current settings
    const settings = await SystemSettings.findOne();
    console.log('📊 Current settings ID:', settings.id);
    
    // 2. Create EXACTLY what admin wants
    const newTrainerLevelSettings = {
      L1: {
        totalAssessmentsRequired: 10,
        minScore: 70,
        qualifyingAssessmentsRequired: 10,
        enabled: true
      },
      L2: {
        totalAssessmentsRequired: 10,  // Admin wants this
        minScore: 85,
        qualifyingAssessmentsRequired: 5,  // Admin wants this
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
    
    console.log('🔧 Setting L2 to:', JSON.stringify(newTrainerLevelSettings.L2, null, 2));
    
    // 3. Direct database update
    const [affectedRows] = await SystemSettings.update(
      { 
        trainerLevelSettings: newTrainerLevelSettings,
        updatedAt: new Date()  // Force timestamp update
      },
      { 
        where: { id: settings.id },
        returning: true 
      }
    );
    
    console.log('✅ Database updated! Affected rows:', affectedRows);
    
    // 4. Verify
    const updated = await SystemSettings.findOne();
    console.log('🔍 Verification - L2 settings:', JSON.stringify(updated.trainerLevelSettings.L2, null, 2));
    console.log('🔍 Updated timestamp:', updated.updatedAt);
    
    console.log('\n🎉 DIRECT UPDATE COMPLETED!');
    console.log('📝 Now refresh admin page - should show L2: 10 total, 5 qualifying');
    
  } catch (error) {
    console.error('❌ Direct update failed:', error);
  } finally {
    process.exit(0);
  }
};

directUpdate();
