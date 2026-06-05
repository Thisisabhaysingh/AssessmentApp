import { sequelize } from '../config/db.js';

const syncTrainerLevels = async () => {
  try {
    console.log('Syncing trainer level database...');
    
    // Sync all models with alter: true to add new fields
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully!');
    
    // Update existing trainers to have L0 level if not set
    const { User } = await import('../config/db.js');
    
    await User.update(
      { 
        trainerLevel: sequelize.literal('COALESCE(trainerLevel, "L0")'),
        levelPerformanceData: sequelize.literal('COALESCE(levelPerformanceData, "{}")')
      },
      { 
        where: { 
          role: 'trainer',
          trainerLevel: null 
        } 
      }
    );
    
    console.log('Existing trainers updated with default levels');
    
  } catch (error) {
    console.error('Database sync failed:', error);
  } finally {
    await sequelize.close();
  }
};

syncTrainerLevels();
