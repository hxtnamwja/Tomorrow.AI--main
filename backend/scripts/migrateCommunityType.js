import { initDatabase, runQuery, getAllRows } from '../database.js';

const db = initDatabase();

const migrate = async () => {
  console.log('Starting community type migration...');
  
  // 1. Check if type column exists
  const checkColumn = async () => {
    try {
      await getAllRows('SELECT type FROM communities LIMIT 1');
      console.log('Type column already exists, skipping column creation');
      return true;
    } catch (err) {
      console.log('Type column does not exist, creating it');
      return false;
    }
  };

  const columnExists = await checkColumn();
  
  if (!columnExists) {
    // Add type column
    await runQuery(`
      ALTER TABLE communities 
      ADD COLUMN type TEXT DEFAULT 'closed' 
      CHECK(type IN ('open', 'closed'))
    `);
    console.log('Type column added successfully');
  }

  // Update all existing communities to have type 'closed' if not already set
  await runQuery(`
    UPDATE communities 
    SET type = 'closed' 
    WHERE type IS NULL OR type NOT IN ('open', 'closed')
  `);
  
  console.log('Migration completed successfully!');
  process.exit(0);
};

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
