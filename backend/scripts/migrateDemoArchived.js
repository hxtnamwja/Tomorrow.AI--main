
import { initDatabase, getAllRows, runQuery, closeDatabase } from '../database.js';

console.log('Starting demo archived fields migration...');

const db = initDatabase();

try {
  // Check if archived column exists
  const tableInfo = await getAllRows("PRAGMA table_info(demos)");
  const hasArchived = tableInfo.some(col => col.name === 'archived');
  const hasArchivedAt = tableInfo.some(col => col.name === 'archived_at');

  if (!hasArchived) {
    console.log('Adding archived column to demos table...');
    await runQuery('ALTER TABLE demos ADD COLUMN archived INTEGER DEFAULT 0');
    console.log('✓ archived column added');
  } else {
    console.log('✓ archived column already exists');
  }

  if (!hasArchivedAt) {
    console.log('Adding archived_at column to demos table...');
    await runQuery('ALTER TABLE demos ADD COLUMN archived_at INTEGER');
    console.log('✓ archived_at column added');
  } else {
    console.log('✓ archived_at column already exists');
  }

  console.log('Demo archived fields migration complete!');
} catch (error) {
  console.error('Error during migration:', error);
  process.exit(1);
} finally {
  closeDatabase();
}
