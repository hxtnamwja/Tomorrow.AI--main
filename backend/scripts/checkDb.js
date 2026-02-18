import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'sci_demo_hub.db');
console.log('Checking database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Successfully opened database');
  }
});

db.all("PRAGMA table_info(feedback)", (err, rows) => {
  if (err) {
    console.error('Error getting table info:', err);
  } else {
    console.log('\nFeedback table structure:');
    rows.forEach(row => {
      console.log(`  ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''}`);
    });
  }
  
  db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='feedback'", (err, rows) => {
    if (err) {
      console.error('Error getting table schema:', err);
    } else if (rows.length > 0) {
      console.log('\nFeedback table schema:');
      console.log(rows[0].sql);
    }
    db.close();
  });
});
