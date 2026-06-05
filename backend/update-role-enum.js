import { sequelize } from './src/config/db.js';

async function updateRoleEnum() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Update the role ENUM to include school_ops_manager
    const query = `
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'manager', 'school_ops_manager', 'trainer') NOT NULL;
    `;
    
    await sequelize.query(query);
    console.log('Role ENUM updated successfully!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating role ENUM:', error);
    process.exit(1);
  }
}

updateRoleEnum();
