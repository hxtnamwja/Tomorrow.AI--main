import { initDatabase, runQuery, getAllRows } from '../database.js';

const db = initDatabase();

const migrate = async () => {
  try {
    console.log('Creating demo_locations table...');
    
    await runQuery(`
      CREATE TABLE IF NOT EXISTS demo_locations (
        id TEXT PRIMARY KEY,
        demo_id TEXT NOT NULL,
        layer TEXT NOT NULL CHECK(layer IN ('general', 'community')),
        community_id TEXT,
        category_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE,
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
        UNIQUE(demo_id, layer, community_id)
      )
    `);
    
    console.log('✅ demo_locations table created successfully!');
    
    console.log('Migrating existing demo locations...');
    
    const demos = await getAllRows('SELECT * FROM demos WHERE status = "published"');
    
    for (const demo of demos) {
      await runQuery(`
        INSERT OR IGNORE INTO demo_locations (id, demo_id, layer, community_id, category_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        `loc-${demo.id}`,
        demo.id,
        demo.layer,
        demo.community_id,
        demo.category_id,
        demo.created_at
      ]);
    }
    
    console.log('✅ Existing demo locations migrated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();
