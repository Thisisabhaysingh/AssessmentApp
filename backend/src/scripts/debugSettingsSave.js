import { SystemSettings } from '../config/db.js';

const debugSettingsSave = async () => {
  try {
    console.log('🔍 Debugging settings save/load cycle...\n');
    
    // 1. Get current settings from database
    const currentSettings = await SystemSettings.findOne();
    if (currentSettings) {
      console.log('📊 Current database settings:');
      console.log('trainerLevelSettings.L2:', JSON.stringify(currentSettings.trainerLevelSettings?.L2, null, 2));
    }
    
    // 2. Simulate the update that admin would make
    const newL2Settings = {
      totalAssessmentsRequired: 10,  // Admin changed this
      minScore: 85,              // Admin kept this
      qualifyingAssessmentsRequired: 5,  // Admin changed this
      enabled: true,
      requiresPreviousLevel: true
    };
    
    console.log('\n🎯 Simulating admin update:');
    console.log('New L2 settings:', JSON.stringify(newL2Settings, null, 2));
    
    // 3. Update the settings
    if (currentSettings) {
      const updatedSettings = { ...currentSettings.trainerLevelSettings };
      updatedSettings.L2 = newL2Settings;
      
      await currentSettings.update({
        trainerLevelSettings: updatedSettings
      });
      
      console.log('✅ Settings updated in database');
    }
    
    // 4. Immediately read back to verify
    const verifySettings = await SystemSettings.findOne();
    if (verifySettings) {
      console.log('\n🔍 Verification - what came back from database:');
      console.log('trainerLevelSettings.L2:', JSON.stringify(verifySettings.trainerLevelSettings?.L2, null, 2));
      
      // 5. Compare
      const updatedL2 = verifySettings.trainerLevelSettings?.L2;
      if (updatedL2?.totalAssessmentsRequired === 10 && updatedL2?.qualifyingAssessmentsRequired === 5) {
        console.log('✅ SUCCESS: New settings saved correctly!');
      } else {
        console.log('❌ ISSUE: Settings not saved as expected');
        console.log('Expected: totalAssessmentsRequired=10, qualifyingAssessmentsRequired=5');
        console.log('Got:', JSON.stringify(updatedL2, null, 2));
      }
    }
    
    console.log('\n🎉 Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    process.exit(0);
  }
};

debugSettingsSave();
