import { sequelize, User } from './src/config/db.js';

async function updateExistingUsers() {
  try {
    console.log('Updating existing users with default lastLogin...');

    // Update users who have never logged in to show their account creation date
    const [results] = await sequelize.query(`
      UPDATE users 
      SET lastLogin = createdAt 
      WHERE lastLogin IS NULL
    `);

    console.log(`✅ Updated ${results} users with lastLogin timestamps`);

    // Show current user data
    const users = await User.findAll({ 
      attributes: ['id', 'name', 'email', 'status', 'lastLogin', 'createdAt'],
      limit: 5
    });

    console.log('\n📊 Current user data:');
    users.forEach(user => {
      console.log(`  ${user.name}: status=${user.status}, lastLogin=${user.lastLogin || 'NULL'}`);
    });

    console.log('\n🎉 Update completed successfully!');
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

updateExistingUsers();
