import { initDatabase, runQuery, getAllRows } from '../database.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = initDatabase();

const migrateBountyProgramInfo = async () => {
  console.log('Starting bounty program info migration...');
  
  try {
    const tableInfo = await getAllRows("PRAGMA table_info(bounties)");
    
    const hasProgramTitle = tableInfo.some(col => col.name === 'program_title');
    if (!hasProgramTitle) {
      console.log('Adding program_title column...');
      await runQuery('ALTER TABLE bounties ADD COLUMN program_title TEXT');
      console.log('program_title column added');
    }
    
    const hasProgramDescription = tableInfo.some(col => col.name === 'program_description');
    if (!hasProgramDescription) {
      console.log('Adding program_description column...');
      await runQuery('ALTER TABLE bounties ADD COLUMN program_description TEXT');
      console.log('program_description column added');
    }
    
    const hasProgramTags = tableInfo.some(col => col.name === 'program_tags');
    if (!hasProgramTags) {
      console.log('Adding program_tags column...');
      await runQuery('ALTER TABLE bounties ADD COLUMN program_tags TEXT');
      console.log('program_tags column added');
    }
    
    console.log('Bounty program info migration completed successfully!');
    
    const finalTableInfo = await getAllRows("PRAGMA table_info(bounties)");
    console.log('\nFinal bounties table structure:');
    finalTableInfo.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
    });
    
  } catch (error) {
    console.error('Error migrating bounty program info:', error);
    throw error;
  }
};

(async () => {
  try {
    await migrateBountyProgramInfo();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
