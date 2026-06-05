import { SystemSettings } from '../config/db.js';
import TrainerLevelService from '../services/trainerLevelService.js';

const debugTrainerSettings = async () => {
  try {
    console.log('🔍 Debugging trainer level settings...\n');
    
    // 1. Check what's in the database
    console.log('📊 Database Settings:');
    const dbSettings = await SystemSettings.findOne();
    if (dbSettings) {
      console.log('✅ Settings found in database');
      console.log('trainerLevelSettings:', JSON.stringify(dbSettings.trainerLevelSettings, null, 2));
    } else {
      console.log('❌ No settings found in database');
    }
    
    console.log('\n🎯 Service Settings:');
    // 2. Check what the service returns
    const serviceSettings = await TrainerLevelService.getLevelRequirements();
    console.log('Service returns:', JSON.stringify(serviceSettings, null, 2));
    
    console.log('\n🔄 Comparison:');
    // 3. Compare them
    if (dbSettings?.trainerLevelSettings) {
      const dbL2 = dbSettings.trainerLevelSettings.L2;
      const serviceL2 = serviceSettings.L2;
      
      console.log('Database L2:', JSON.stringify(dbL2, null, 2));
      console.log('Service L2:', JSON.stringify(serviceL2, null, 2));
      
      if (JSON.stringify(dbL2) === JSON.stringify(serviceL2)) {
        console.log('✅ Database and Service settings match!');
      } else {
        console.log('❌ Database and Service settings differ!');
      }
    }
    
    console.log('\n🎉 Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    process.exit(0);
  }
};

debugTrainerSettings();
