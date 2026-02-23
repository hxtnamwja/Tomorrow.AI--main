import { runQuery, getAllRows } from '../database.js';

console.log('Starting user points migration...');

async function migrate() {
  try {
    // Check if columns already exist
    const columns = await getAllRows("PRAGMA table_info(users)");
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('contribution_points')) {
      console.log('Adding contribution_points column...');
      await runQuery('ALTER TABLE users ADD COLUMN contribution_points INTEGER DEFAULT 0');
    }
    
    if (!columnNames.includes('points')) {
      console.log('Adding points column...');
      await runQuery('ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0');
    }
    
    if (!columnNames.includes('favorites')) {
      console.log('Adding favorites column...');
      await runQuery('ALTER TABLE users ADD COLUMN favorites TEXT DEFAULT "[]"');
    }
    
    if (!columnNames.includes('avatar_border')) {
      console.log('Adding avatar_border column...');
      await runQuery('ALTER TABLE users ADD COLUMN avatar_border TEXT');
    }
    
    if (!columnNames.includes('username_color')) {
      console.log('Adding username_color column...');
      await runQuery('ALTER TABLE users ADD COLUMN username_color TEXT');
    }
    
    if (!columnNames.includes('profile_theme')) {
      console.log('Adding profile_theme column...');
      await runQuery('ALTER TABLE users ADD COLUMN profile_theme TEXT');
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
