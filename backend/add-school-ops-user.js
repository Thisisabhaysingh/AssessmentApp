import bcrypt from 'bcryptjs';
import { sequelize } from './src/config/db.js';
import { User } from './src/config/db.js';

async function addSchoolOpsManager() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: 'schoolops@example.com' }
    });
    
    if (existingUser) {
      console.log('User already exists. Updating role to school_ops_manager...');
      await existingUser.update({
        name: 'School Ops Sarah',
        role: 'school_ops_manager',
        department: 'Operations',
        designation: 'School Operations Manager',
        status: 'active'
      });
      console.log('User updated successfully!');
    } else {
      // Create new user
      const user = await User.create({
        name: 'School Ops Sarah',
        email: 'schoolops@example.com',
        password: hashedPassword,
        role: 'school_ops_manager',
        department: 'Operations',
        designation: 'School Operations Manager',
        status: 'active'
      });
      console.log('School Operations Manager user created successfully!');
      console.log('Email: schoolops@example.com');
      console.log('Password: password123');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error adding user:', error);
    process.exit(1);
  }
}

addSchoolOpsManager();
