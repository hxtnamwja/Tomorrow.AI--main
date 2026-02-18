import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'database.db');
console.log('Checking database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Successfully opened database');
  }
});

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error getting tables:', err);
  } else {
    console.log('\nTables in database:');
    tables.forEach(table => console.log('  -', table.name));
  }
  
  db.all("PRAGMA table_info(feedback)", (err, rows) => {
    if (err) {
      console.error('Error getting feedback table info:', err);
      console.log('\nCreating feedback table...');
      
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
        db.close();
      });
    } else {
      console.log('\nFeedback table exists! Checking type constraint...');
      
      db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='feedback'", (err, schema) => {
        if (err) {
          console.error('Error getting schema:', err);
          db.close();
          return;
        }
        
        console.log('\nCurrent schema:', schema[0].sql);
        
        if (!schema[0].sql.includes('ban_appeal')) {
          console.log('\nNeed to update table schema...');
          
          // Create new table with updated constraint
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
              console.error('Error creating new table:', err);
              db.close();
              return;
            }
            
            // Copy data
            db.run('INSERT INTO feedback_new SELECT * FROM feedback', (err) => {
              if (err) {
                console.error('Error copying data:', err);
              } else {
                console.log('Data copied successfully');
                
                // Replace old table
                db.run('DROP TABLE feedback', (err) => {
                  if (err) {
                    console.error('Error dropping old table:', err);
                  } else {
                    db.run('ALTER TABLE feedback_new RENAME TO feedback', (err) => {
                      if (err) {
                        console.error('Error renaming table:', err);
                      } else {
                        console.log('Table updated successfully!');
                      }
                      db.close();
                    });
                  }
                });
              }
            });
          });
        } else {
          console.log('\nTable is already up to date!');
          db.close();
        }
      });
    }
  });
});
