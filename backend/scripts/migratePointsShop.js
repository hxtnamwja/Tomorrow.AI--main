import { runQuery, getAllRows } from '../database.js';

console.log('Starting points shop migration...');

async function migrate() {
  try {
    const columns = await getAllRows("PRAGMA table_info(users)");
    const columnNames = columns.map(col => col.name);
    
    const newColumns = [
      { name: 'avatar_accessory', type: 'TEXT' },
      { name: 'avatar_effect', type: 'TEXT' },
      { name: 'username_effect', type: 'TEXT' },
      { name: 'profile_background', type: 'TEXT' },
      { name: 'custom_title', type: 'TEXT' },
      { name: 'unlocked_achievements', type: 'TEXT', default: '"[]"' },
      { name: 'owned_items', type: 'TEXT', default: '"[]"' }
    ];
    
    for (const col of newColumns) {
      if (!columnNames.includes(col.name)) {
        console.log(`Adding ${col.name} column...`);
        let sql = `ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`;
        if (col.default) {
          sql += ` DEFAULT ${col.default}`;
        }
        await runQuery(sql);
      }
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
