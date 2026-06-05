import { sequelize } from '../src/config/db.js';

export const up = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      type ENUM('reading', 'video', 'quiz', 'assignment', 'practical', 'project') NOT NULL,
      duration INT NOT NULL,
      \`order\` INT NOT NULL DEFAULT 1,
      isRequired BOOLEAN DEFAULT TRUE,
      courseId INT NOT NULL,
      content TEXT,
      resources TEXT,
      passingScore INT DEFAULT 70,
      maxAttempts INT DEFAULT 3,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  // Add index for courseId
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_activities_courseId ON activities(courseId)
  `);

  // Add index for order
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_activities_order ON activities(courseId, \`order\`)
  `);
};

export const down = async () => {
  await sequelize.query('DROP TABLE IF EXISTS activities');
};
