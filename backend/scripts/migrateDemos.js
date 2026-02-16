import { initDatabase, runQuery, getAllRows } from '../database.js';

const db = initDatabase();

const migrateDemos = async () => {
  console.log('Starting demos migration...');
  
  try {
    // Add creator_id column if it doesn't exist
    await runQuery(`
      ALTER TABLE demos ADD COLUMN creator_id TEXT
    `);
    console.log('Added creator_id column to demos table');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('creator_id column already exists');
    } else {
      throw error;
    }
  }

  console.log('\n✅ Demos migration completed successfully!');
  process.exit(0);
};

migrateDemos().catch(error => {
  console.error('Error migrating demos:', error);
  process.exit(1);
});
