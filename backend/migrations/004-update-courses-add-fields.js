import { sequelize } from '../src/config/db.js';

export const up = async () => {
  // Add duration field to courses table
  await sequelize.query(`
    ALTER TABLE courses 
    ADD COLUMN duration INT DEFAULT 0
  `);

  // Add status field to courses table
  await sequelize.query(`
    ALTER TABLE courses 
    ADD COLUMN status ENUM('draft', 'published', 'archived') DEFAULT 'draft'
  `);

  // Add timestamps if they don't exist
  await sequelize.query(`
    ALTER TABLE courses 
    ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  await sequelize.query(`
    ALTER TABLE courses 
    ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  `);
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
