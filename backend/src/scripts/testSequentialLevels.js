import TrainerLevelService from '../services/trainerLevelService.js';

const testSequentialLevels = async () => {
  try {
    console.log('🎯 Testing sequential level progression...');
    
    // Test with trainer 4 (Shivam Saini)
    const trainerId = 4;
    
    // Calculate trainer level
    const levelData = await TrainerLevelService.calculateTrainerLevel(trainerId);
    
    console.log('📊 Level Results:');
    console.log(`🎓 Current Level: ${levelData.currentLevel}`);
    console.log(`📅 Level Achieved Date: ${levelData.levelAchievedDate}`);
    
    console.log('\n🔍 Level Progress Details:');
    Object.entries(levelData.progress).forEach(([level, progress]) => {
      console.log(`${level}:`);
      console.log(`  ✅ Qualified: ${progress.qualified}`);
      console.log(`  📊 Qualifying Count: ${progress.qualifyingCount}`);
      console.log(`  📈 Required Count: ${progress.requiredCount}`);
      console.log(`  📅 Achieved At: ${progress.achievedAt || 'Not achieved'}`);
      console.log('');
    });
    
    console.log('📋 Assessment Details:');
    if (levelData.assessments && Array.isArray(levelData.assessments)) {
      levelData.assessments.forEach((assessment, index) => {
        console.log(`${index + 1}. Assessment ${assessment.assessmentId}: ${assessment.percentage}% (${assessment.scheduledDate})`);
      });
    } else {
      console.log('No assessment details available');
    }
    
    // Check if sequential progression is working
    const l1Qualified = levelData.progress.L1.qualified;
    const l2Qualified = levelData.progress.L2.qualified;
    const l3Qualified = levelData.progress.L3.qualified;
    
    console.log('\n🔍 Sequential Progression Check:');
    console.log(`L1 Qualified: ${l1Qualified}`);
    console.log(`L2 Qualified: ${l2Qualified}`);
    console.log(`L3 Qualified: ${l3Qualified}`);
    
    if (l3Qualified && !l2Qualified) {
      console.log('❌ ERROR: L3 qualified but L2 not qualified - sequential progression broken!');
    } else if (l2Qualified && !l1Qualified) {
      console.log('❌ ERROR: L2 qualified but L1 not qualified - sequential progression broken!');
    } else {
      console.log('✅ Sequential progression is working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Error testing sequential levels:', error);
  } finally {
    process.exit(0);
  }
};

// Run the function
testSequentialLevels();
