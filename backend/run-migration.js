import mysql from 'mysql2/promise';
import { env } from './src/config/env.js';

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: env.DB.HOST,
      user: env.DB.USER,
      password: env.DB.PASSWORD,
      database: env.DB.NAME
    });

    console.log('Connected to database, running migration...');

    // Add status column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active'
      `);
      console.log('✅ Added status column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ status column already exists');
      } else {
        throw error;
      }
    }

    // Add lastLogin column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN lastLogin DATETIME NULL
      `);
      console.log('✅ Added lastLogin column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ lastLogin column already exists');
      } else {
        throw error;
      }
    }

    await connection.end();
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
