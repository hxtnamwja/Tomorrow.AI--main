import { initDatabase, runQuery, getRow, getAllRows } from '../database.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = initDatabase();

const migrateDatabase = async () => {
  try {
    // Check if columns exist and add them if not
    const checkColumn = async (columnName) => {
      try {
        const result = await getRow(`PRAGMA table_info(users)`);
        // Get all columns
        const columns = await getAllRows(`PRAGMA table_info(users)`);
        return columns.some(col => col.name === columnName);
      } catch {
        return false;
      }
    };

    const columnsToAdd = [
      { name: 'is_banned', type: 'INTEGER DEFAULT 0' },
      { name: 'ban_reason', type: 'TEXT' },
      { name: 'contact_info', type: 'TEXT' },
      { name: 'payment_qr', type: 'TEXT' },
      { name: 'bio', type: 'TEXT' },
      { name: 'password', type: 'TEXT' }
    ];

    for (const col of columnsToAdd) {
      const exists = await checkColumn(col.name);
      if (!exists) {
        try {
          await runQuery(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
          console.log(`Added column: ${col.name}`);
        } catch (err) {
          console.log(`Could not add column ${col.name}:`, err.message);
        }
      } else {
        console.log(`Column ${col.name} already exists`);
      }
    }

    // Set default password for existing users
    const users = await getAllRows('SELECT id FROM users WHERE password IS NULL OR password = ""');
    for (const user of users) {
      await runQuery('UPDATE users SET password = ? WHERE id = ?', ['123456', user.id]);
    }
    if (users.length > 0) {
      console.log(`Set default password for ${users.length} users`);
    }

    console.log('\n✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error migrating database:', error);
    process.exit(1);
  }
};

migrateDatabase();
