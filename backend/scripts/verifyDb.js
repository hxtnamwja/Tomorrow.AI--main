import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'database.db');
console.log('Verifying database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  } else {
    console.log('Successfully opened database');
  }
});

db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='feedback'", (err, rows) => {
  if (err) {
    console.error('Error getting table schema:', err);
  } else if (rows.length > 0) {
    console.log('\nCurrent feedback table schema:');
    console.log(rows[0].sql);
    
    if (rows[0].sql.includes('ban_appeal')) {
      console.log('\n✓ ban_appeal type is present in the schema!');
    } else {
      console.log('\n✗ ban_appeal type is NOT present in the schema!');
    }
  } else {
    console.log('\nFeedback table does not exist!');
  }
  
  db.close();
});
