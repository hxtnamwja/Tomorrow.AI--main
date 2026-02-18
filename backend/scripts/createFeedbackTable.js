import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parentDir = dirname(__dirname);
const dataDir = join(parentDir, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(parentDir, 'data', 'sci_demo_hub.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to database');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS feedback (
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
      console.error('Error creating feedback table:', err);
    } else {
      console.log('Feedback table created successfully!');
    }
    
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='feedback'", [], (err, rows) => {
      if (err) {
        console.error('Error checking table:', err);
      } else if (rows.length > 0) {
        console.log('Feedback table exists and is ready to use!');
      }
      db.close();
    });
  });
});
