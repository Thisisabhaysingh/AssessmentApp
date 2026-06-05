import { SystemSettings } from '../config/db.js';

const quickFix = async () => {
  try {
    console.log('🔧 QUICK FIX - Setting admin desired values\n');
    
    // Set exactly what admin wants (from the last save attempt)
    const adminDesiredValues = {
      L1: {
        totalAssessmentsRequired: 10,
        minScore: 70,
        qualifyingAssessmentsRequired: 10,
        enabled: true
      },
      L2: {
        totalAssessmentsRequired: 15,  // Admin changed to this
        minScore: 85,
        qualifyingAssessmentsRequired: 5,   // Admin changed to this
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
    
    console.log('🔧 Setting L2 to:', JSON.stringify(adminDesiredValues.L2, null, 2));
    
    // Force update with timestamp
    await SystemSettings.update(
      { 
        trainerLevelSettings: adminDesiredValues,
        updatedAt: new Date()
      },
      { 
        where: { id: 1 },
        returning: true 
      }
    );
    
    console.log('✅ Database updated with admin desired values!');
    
    // Verify
    const updated = await SystemSettings.findOne();
    console.log('🔍 Verification - L2 settings:', JSON.stringify(updated.trainerLevelSettings.L2, null, 2));
    console.log('🔍 Updated timestamp:', updated.updatedAt);
    
    console.log('\n🎉 QUICK FIX COMPLETED!');
    console.log('📝 Admin values are now saved. Refresh admin page to see changes.');
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
  } finally {
    process.exit(0);
  }
};

quickFix();
