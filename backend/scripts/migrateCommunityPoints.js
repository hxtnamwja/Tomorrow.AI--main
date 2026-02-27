import { runQuery, getAllRows } from '../database.js';

console.log('Starting community_points migration...');

async function migrate() {
  try {
    // Check if column already exists
    const columns = await getAllRows("PRAGMA table_info(users)");
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('community_points')) {
      console.log('Adding community_points column...');
      await runQuery('ALTER TABLE users ADD COLUMN community_points INTEGER DEFAULT 100');
      console.log('Added community_points column with default value 100');
    } else {
      console.log('community_points column already exists');
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
