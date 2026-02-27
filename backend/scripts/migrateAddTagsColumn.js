import { initDatabase, runQuery, getRow } from '../database.js';

const db = initDatabase();

const migrate = async () => {
  try {
    console.log('Checking if demos table has tags column...');
    
    // 检查 demos 表是否已有 tags 列
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(demos)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const hasTagsColumn = tableInfo.some((col) => col.name === 'tags');
    
    if (hasTagsColumn) {
      console.log('tags column already exists in demos table');
    } else {
      console.log('Adding tags column to demos table...');
      await runQuery('ALTER TABLE demos ADD COLUMN tags TEXT');
      console.log('tags column added successfully');
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

migrate();
