import { runQuery } from '../database.js';

const migrateDemoComments = async () => {
  try {
    console.log('Creating demo_comments table...');
    
    await runQuery(`
      CREATE TABLE IF NOT EXISTS demo_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        demo_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ demo_comments table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error migrating demo_comments:', error);
    process.exit(1);
  }
};

migrateDemoComments();
