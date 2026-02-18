import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'data', 'sci_demo_hub.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Updating feedback table type constraint...');
  
  // SQLite doesn't support ALTER TABLE to modify CHECK constraints directly
  // So we need to:
  // 1. Create a new table with the updated constraint
  // 2. Copy data from old table to new table
  // 3. Drop old table
  // 4. Rename new table to old table
  
  db.run(`
    CREATE TABLE IF NOT EXISTS feedback_new (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('demo_complaint', 'community_feedback', 'website_feedback', 'ban_appeal')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      layer TEXT NOT NULL CHECK (layer IN ('general', 'community')),
      community_id TEXT,
      demo_id TEXT,
      demo_title TEXT,
      community_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
      resolution TEXT,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      reviewed_by TEXT,
      reviewed_at INTEGER
    )
  `, (err) => {
    if (err) {
      console.error('Error creating new feedback table:', err);
      db.close();
      return;
    }
    
    console.log('Copying data to new table...');
    db.run(`
      INSERT INTO feedback_new 
      SELECT * FROM feedback
    `, (err) => {
      if (err) {
        console.error('Error copying data:', err);
        db.close();
        return;
      }
      
      console.log('Dropping old table...');
      db.run('DROP TABLE feedback', (err) => {
        if (err) {
          console.error('Error dropping old table:', err);
          db.close();
          return;
        }
        
        console.log('Renaming new table...');
        db.run('ALTER TABLE feedback_new RENAME TO feedback', (err) => {
          if (err) {
            console.error('Error renaming table:', err);
          } else {
            console.log('Successfully updated feedback table!');
          }
          db.close();
        });
      });
    });
  });
});
