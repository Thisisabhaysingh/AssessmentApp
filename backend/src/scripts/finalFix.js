import { SystemSettings } from '../config/db.js';

const finalFix = async () => {
  try {
    console.log('🔧 FINAL FIX - Setting correct trainer level values\n');
    
    // Find settings
    const settings = await SystemSettings.findOne();
    
    // Set the exact values the admin wants
    const correctSettings = {
      L1: {
        totalAssessmentsRequired: 10,
        minScore: 70,
        qualifyingAssessmentsRequired: 10,
        enabled: true
      },
      L2: {
        totalAssessmentsRequired: 20,  // Admin wants this
        minScore: 85,
        qualifyingAssessmentsRequired: 10,  // Admin wants this
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
    
    console.log('🔧 Updating with correct values:', JSON.stringify(correctSettings.L2, null, 2));
    
    // Force update
    await SystemSettings.update(
      { trainerLevelSettings: correctSettings },
      { where: { id: settings.id } }
    );
    
    console.log('✅ Database updated successfully!');
    
    // Verify
    const updated = await SystemSettings.findOne();
    console.log('🔍 Verification - L2 settings:', JSON.stringify(updated.trainerLevelSettings.L2, null, 2));
    
    console.log('\n🎉 FINAL FIX COMPLETED - Backend server needs restart!');
    
  } catch (error) {
    console.error('❌ Final fix failed:', error);
  } finally {
    process.exit(0);
  }
};

finalFix();
