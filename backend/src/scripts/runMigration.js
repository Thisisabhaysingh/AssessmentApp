import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

async function runMigration() {
  try {
    console.log('🎯 Running trainer level settings migration...');
    
    const connection = await mysql.createConnection({
      host: env.DB.HOST,
      user: env.DB.USER,
      password: env.DB.PASSWORD,
      database: env.DB.NAME,
      port: env.DB.PORT
    });
    
    // Add trainerLevelSettings column without default value
    const alterSQL = `
      ALTER TABLE system_settings 
      ADD COLUMN trainerLevelSettings JSON
    `;
    
    await connection.execute(alterSQL);
    console.log('✅ trainerLevelSettings column added successfully!');
    
    // Update existing records with default values
    const defaultValues = '{"L1":{"totalAssessmentsRequired":10,"minScore":70,"qualifyingAssessmentsRequired":10,"enabled":true},"L2":{"totalAssessmentsRequired":20,"minScore":85,"qualifyingAssessmentsRequired":10,"enabled":true,"requiresPreviousLevel":true},"L3":{"totalAssessmentsRequired":25,"minScore":90,"qualifyingAssessmentsRequired":5,"enabled":true,"requiresPreviousLevel":true}}';
    
    const updateSQL = `
      UPDATE system_settings 
      SET trainerLevelSettings = ? 
      WHERE trainerLevelSettings IS NULL
    `;
    
    await connection.execute(updateSQL, [defaultValues]);
    console.log('✅ Default trainer level settings added!');
    
    await connection.end();
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('✅ trainerLevelSettings column already exists!');
    } else {
      console.error('❌ Migration failed:', error);
    }
    process.exit(0);
  }
}

runMigration();
