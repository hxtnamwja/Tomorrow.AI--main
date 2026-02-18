import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const parentDir = dirname(__dirname);

const dbPath = join(parentDir, 'data', 'sci_demo_hub.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to database');
});

console.log('\n=== Checking tables ===');
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('Error listing tables:', err);
  } else {
    console.log('Tables:', tables.map(t => t.name));
  }
  
  console.log('\n=== Checking feedback table ===');
  db.all("SELECT * FROM feedback", [], (err, rows) => {
    if (err) {
      console.error('Error querying feedback:', err);
    } else {
      console.log(`Found ${rows.length} feedback entries:`);
      rows.forEach((row, index) => {
        console.log(`\n${index + 1}. ${row.title} (${row.type})`);
        console.log(`   Created at: ${new Date(row.created_at).toLocaleString()}`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Created by: ${row.created_by}`);
      });
    }
    db.close();
  });
});
