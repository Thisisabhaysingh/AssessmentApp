import { SystemSettings } from '../config/db.js';

// Add trainer level settings to existing system settings
const addTrainerLevelSettings = async () => {
  try {
    console.log('🎯 Adding trainer level settings to system settings...');
    
    // Get current settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      console.log('❌ No system settings found. Creating default settings...');
      settings = await SystemSettings.create({});
    }
    
    // Check if trainerLevelSettings already exists
    if (settings.trainerLevelSettings) {
      console.log('✅ Trainer level settings already exist!');
      console.log('Current settings:', JSON.stringify(settings.trainerLevelSettings, null, 2));
    } else {
      // Add default trainer level settings
      const defaultTrainerLevelSettings = {
        L1: {
          totalAssessmentsRequired: 10,
          minScore: 70,
          qualifyingAssessmentsRequired: 10,
          enabled: true
        },
        L2: {
          totalAssessmentsRequired: 20,
          minScore: 85,
          qualifyingAssessmentsRequired: 10,
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
      
      await settings.update({
        trainerLevelSettings: defaultTrainerLevelSettings
      });
      
      console.log('✅ Trainer level settings added successfully!');
      console.log('Default settings:', JSON.stringify(defaultTrainerLevelSettings, null, 2));
    }
    
    console.log('🎉 Trainer level settings migration completed!');
    
  } catch (error) {
    console.error('❌ Error adding trainer level settings:', error);
  } finally {
    process.exit(0);
  }
};

// Run the migration
addTrainerLevelSettings();
