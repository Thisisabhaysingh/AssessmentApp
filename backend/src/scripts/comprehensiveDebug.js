import { SystemSettings } from '../config/db.js';
import TrainerLevelService from '../services/trainerLevelService.js';

const comprehensiveDebug = async () => {
  try {
    console.log('🔍 COMPREHENSIVE DEBUG STARTED\n');
    
    // 1. Check current database state
    console.log('📊 1. CURRENT DATABASE STATE:');
    const dbSettings = await SystemSettings.findOne();
    if (dbSettings) {
      console.log('✅ Settings found in database');
      console.log('trainerLevelSettings.L2:', JSON.stringify(dbSettings.trainerLevelSettings?.L2, null, 2));
      console.log('Full trainerLevelSettings:', JSON.stringify(dbSettings.trainerLevelSettings, null, 2));
    } else {
      console.log('❌ No settings found in database');
    }
    
    // 2. Test service level requirements
    console.log('\n🎯 2. SERVICE LEVEL REQUIREMENTS:');
    const levelRequirements = await TrainerLevelService.getLevelRequirements();
    console.log('Service returns for L2:', JSON.stringify(levelRequirements.L2, null, 2));
    
    // 3. Test a specific trainer calculation
    console.log('\n🧮 3. TRAINER CALCULATION TEST:');
    const testResult = await TrainerLevelService.calculateTrainerLevel(1); // Test with trainer ID 1
    console.log('Trainer 1 level calculation result:');
    console.log('- Current level:', testResult.currentLevel);
    console.log('- L2 progress:', JSON.stringify(testResult.progress?.L2, null, 2));
    
    // 4. Compare database vs service
    console.log('\n🔄 4. DATABASE vs SERVICE COMPARISON:');
    if (dbSettings?.trainerLevelSettings?.L2 && levelRequirements?.L2) {
      const dbL2 = dbSettings.trainerLevelSettings.L2;
      const serviceL2 = levelRequirements.L2;
      
      console.log('Database L2.totalAssessmentsRequired:', dbL2.totalAssessmentsRequired);
      console.log('Service L2.totalAssessmentsRequired:', serviceL2.totalAssessmentsRequired);
      console.log('Match:', dbL2.totalAssessmentsRequired === serviceL2.totalAssessmentsRequired);
      
      console.log('Database L2.qualifyingAssessmentsRequired:', dbL2.qualifyingAssessmentsRequired);
      console.log('Service L2.qualifyingAssessmentsRequired:', serviceL2.qualifyingAssessmentsRequired);
      console.log('Match:', dbL2.qualifyingAssessmentsRequired === serviceL2.qualifyingAssessmentsRequired);
    }
    
    console.log('\n🎉 COMPREHENSIVE DEBUG COMPLETED');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    process.exit(0);
  }
};

comprehensiveDebug();
