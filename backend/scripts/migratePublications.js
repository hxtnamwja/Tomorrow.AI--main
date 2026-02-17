import { initDatabase, runQuery } from '../database.js';

const db = initDatabase();

const migrate = async () => {
  try {
    console.log('Creating demo_publications table...');
    
    await runQuery(`
      CREATE TABLE IF NOT EXISTS demo_publications (
        id TEXT PRIMARY KEY,
        demo_id TEXT NOT NULL,
        layer TEXT NOT NULL CHECK(layer IN ('general', 'community')),
        community_id TEXT,
        category_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'published', 'rejected')),
        rejection_reason TEXT,
        requested_by TEXT NOT NULL,
        requested_at INTEGER NOT NULL,
        reviewed_by TEXT,
        reviewed_at INTEGER,
        FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE,
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
        FOREIGN KEY (requested_by) REFERENCES users(id),
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
      )
    `);
    
    console.log('✅ demo_publications table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();
