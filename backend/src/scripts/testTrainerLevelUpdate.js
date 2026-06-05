import TrainerLevelService from '../services/trainerLevelService.js';
import { User } from '../config/db.js';

const testTrainerLevelUpdate = async () => {
  try {
    console.log('🔄 Testing trainer level update with new settings...\n');
    
    // Get all trainers
    const trainers = await User.findAll({
      where: { role: 'trainer' },
      limit: 3 // Test with first 3 trainers
    });
    
    console.log(`📊 Found ${trainers.length} trainers to test`);
    
    for (const trainer of trainers) {
      console.log(`\n🎯 Testing trainer: ${trainer.name} (ID: ${trainer.id})`);
      
      // Get current level
      const currentLevel = await TrainerLevelService.calculateTrainerLevel(trainer.id);
      console.log('Current level:', currentLevel.currentLevel);
      console.log('Progress:', JSON.stringify(currentLevel.progress, null, 2));
      
      // Get progress details
      const progress = await TrainerLevelService.getTrainerProgress(trainer.id);
      console.log('Detailed progress:', JSON.stringify(progress, null, 2));
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
};

testTrainerLevelUpdate();
