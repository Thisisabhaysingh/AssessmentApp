import { sequelize } from '../src/config/db.js';

export const up = async () => {
  try {
    // Check if duration column exists, add if it doesn't
    await sequelize.query(`
      ALTER TABLE courses 
      ADD COLUMN duration INT DEFAULT 0
    `);
    console.log('✅ Added duration column to courses table');
  } catch (error) {
    if (error.message.includes("Duplicate column name 'duration'")) {
      console.log('✅ Duration column already exists in courses table');
    } else {
      console.error('❌ Error adding duration column:', error.message);
    }
  }

  try {
    // Check if status column exists, add if it doesn't
    await sequelize.query(`
      ALTER TABLE courses 
      ADD COLUMN status ENUM('draft', 'published', 'archived') DEFAULT 'draft'
    `);
    console.log('✅ Added status column to courses table');
  } catch (error) {
    if (error.message.includes("Duplicate column name 'status'")) {
      console.log('✅ Status column already exists in courses table');
    } else {
      console.error('❌ Error adding status column:', error.message);
    }
  }

  try {
    // Check if createdAt column exists, add if it doesn't
    await sequelize.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✅ Added createdAt column to courses table');
  } catch (error) {
    console.log('ℹ️ CreatedAt column info:', error.message);
  }

  try {
    // Check if updatedAt column exists, add if it doesn't
    await sequelize.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    console.log('✅ Added updatedAt column to courses table');
  } catch (error) {
    console.log('ℹ️ UpdatedAt column info:', error.message);
  }
};

export const down = async () => {
  await sequelize.query(`
    ALTER TABLE courses 
    DROP COLUMN duration
  `);

  await sequelize.query(`
    ALTER TABLE courses 
    DROP COLUMN status
  `);
};
