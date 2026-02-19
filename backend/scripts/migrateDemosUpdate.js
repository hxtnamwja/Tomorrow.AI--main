import { initDatabase, runQuery, getAllRows } from '../database.js';

const db = initDatabase();

const migrateDemos = async () => {
  console.log('Starting demos table migration...');
  
  try {
    // 1. Check if creator_id column exists
    const checkCreatorId = await getAllRows("PRAGMA table_info(demos)");
    const hasCreatorId = checkCreatorId.some(col => col.name === 'creator_id');
    
    if (!hasCreatorId) {
      console.log('Adding creator_id column...');
      await runQuery('ALTER TABLE demos ADD COLUMN creator_id TEXT');
      console.log('creator_id column added');
    }
    
    // 2. Check if updated_at column exists
    const checkUpdatedAt = await getAllRows("PRAGMA table_info(demos)");
    const hasUpdatedAt = checkUpdatedAt.some(col => col.name === 'updated_at');
    
    if (!hasUpdatedAt) {
      console.log('Adding updated_at column...');
      await runQuery('ALTER TABLE demos ADD COLUMN updated_at INTEGER');
      console.log('updated_at column added');
    }
    
    // 3. Check if original_code column exists
    const checkOriginalCode = await getAllRows("PRAGMA table_info(demos)");
    const hasOriginalCode = checkOriginalCode.some(col => col.name === 'original_code');
    
    if (!hasOriginalCode) {
      console.log('Adding original_code column...');
      await runQuery('ALTER TABLE demos ADD COLUMN original_code TEXT');
      console.log('original_code column added');
    }
    
    // 4. Check if config column exists
    const checkConfig = await getAllRows("PRAGMA table_info(demos)");
    const hasConfig = checkConfig.some(col => col.name === 'config');
    
    if (!hasConfig) {
      console.log('Adding config column...');
      await runQuery('ALTER TABLE demos ADD COLUMN config TEXT');
      console.log('config column added');
    }
    
    console.log('\n✅ Demos table migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error migrating demos table:', error);
    process.exit(1);
  }
};

migrateDemos();
