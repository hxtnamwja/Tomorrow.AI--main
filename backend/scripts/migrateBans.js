import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(__dirname, 'data', 'sci_demo_hub.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS community_bans (
      id TEXT PRIMARY KEY,
      community_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reason TEXT,
      banned_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(community_id, user_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating community_bans table:', err);
    } else {
      console.log('Community bans table created successfully!');
    }
    db.close();
  });
});
