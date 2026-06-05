import { sequelize } from '../src/config/db.js';

async function columnExists(tableName, columnName) {
  try {
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND TABLE_SCHEMA = DATABASE()
    `, { replacements: [tableName, columnName] });
    return results.length > 0;
  } catch (e) {
    return false;
  }
}

async function addColumn(tableName, columnName, columnDef) {
  try {
    const exists = await columnExists(tableName, columnName);
    if (exists) {
      console.log(`⏭️  Column '${columnName}' already exists in ${tableName}, skipping...`);
      return;
    }
    await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
    console.log(`✅ Added ${columnName} to ${tableName} table`);
  } catch (error) {
    if (error.message.includes('Duplicate column')) {
      console.log(`⏭️  Column '${columnName}' already exists in ${tableName}, skipping...`);
    } else {
      throw error;
    }
  }
}

async function runMigration() {
  try {
    console.log('Running migration: Adding deletedAt columns...\n');

    await addColumn('users', 'deletedAt', 'DATETIME NULL');
    await addColumn('courses', 'deletedAt', 'DATETIME NULL');
    await addColumn('assessments', 'deletedAt', 'DATETIME NULL');

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
