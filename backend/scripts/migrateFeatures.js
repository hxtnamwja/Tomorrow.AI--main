import { getDatabase } from '../database.js';

const db = getDatabase();

try {
  console.log('Starting feature migration...');

  // Add config column to demos table
  db.exec(`
    ALTER TABLE demos ADD COLUMN config TEXT;
  `);
  console.log('✓ Added config column to demos table');

  // Add original_code column to demos table
  db.exec(`
    ALTER TABLE demos ADD COLUMN original_code TEXT;
  `);
  console.log('✓ Added original_code column to demos table');

  // Create demo_data_storage table for storing user data
  db.exec(`
    CREATE TABLE IF NOT EXISTS demo_data_storage (
      id TEXT PRIMARY KEY,
      demo_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      data_key TEXT NOT NULL,
      data_value TEXT NOT NULL,
      data_type TEXT DEFAULT 'string',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(demo_id, user_id, data_key)
    );
  `);
  console.log('✓ Created demo_data_storage table');

  // Create demo_rooms table for multiplayer rooms
  db.exec(`
    CREATE TABLE IF NOT EXISTS demo_rooms (
      id TEXT PRIMARY KEY,
      demo_id TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      room_name TEXT NOT NULL,
      max_players INTEGER DEFAULT 2,
      current_players INTEGER DEFAULT 0,
      status TEXT DEFAULT 'waiting',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('✓ Created demo_rooms table');

  // Create demo_room_members table for room members
  db.exec(`
    CREATE TABLE IF NOT EXISTS demo_room_members (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      joined_at INTEGER NOT NULL,
      is_host INTEGER DEFAULT 0,
      FOREIGN KEY (room_id) REFERENCES demo_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(room_id, user_id)
    );
  `);
  console.log('✓ Created demo_room_members table');

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_demo_data_demo ON demo_data_storage(demo_id);
    CREATE INDEX IF NOT EXISTS idx_demo_data_user ON demo_data_storage(user_id);
    CREATE INDEX IF NOT EXISTS idx_demo_rooms_demo ON demo_rooms(demo_id);
    CREATE INDEX IF NOT EXISTS idx_demo_rooms_status ON demo_rooms(status);
    CREATE INDEX IF NOT EXISTS idx_demo_room_members_room ON demo_room_members(room_id);
  `);
  console.log('✓ Created indexes');

  console.log('\n✅ Feature migration completed successfully!');
} catch (error) {
  if (error.message && error.message.includes('duplicate column name')) {
    console.log('ℹ️  Columns already exist, skipping...');
  } else if (error.message && error.message.includes('table demo_data_storage already exists')) {
    console.log('ℹ️  Tables already exist, skipping...');
  } else {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
