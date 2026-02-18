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

console.log('\n=== Testing pending feedback query ===');
db.all(`
  SELECT * FROM feedback 
  WHERE status IN ('pending', 'in_progress')
  ORDER BY created_at DESC
`, [], (err, rows) => {
  if (err) {
    console.error('Error querying:', err);
  } else {
    console.log(`Found ${rows.length} pending/in_progress feedback entries:`);
    rows.forEach((row, index) => {
      console.log(`\n${index + 1}.`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Title: ${row.title}`);
      console.log(`   Type: ${row.type}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Created at: ${new Date(row.created_at).toLocaleString()}`);
    });
  }
  
  console.log('\n=== Testing mapFeedbackRow function ===');
  console.log('Let\'s see what mapFeedbackRow does:');
  console.log('It should map snake_case to camelCase');
  db.close();
});
