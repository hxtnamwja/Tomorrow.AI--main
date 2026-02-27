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

const migrateBountiesTable = async () => {
  console.log('Starting bounties table migration...');
  
  try {
    // Check if creator_id column exists
    const tableInfo = await getAllRows("PRAGMA table_info(bounties)");
    const hasCreatorId = tableInfo.some(col => col.name === 'creator_id');
    
    if (hasCreatorId) {
      console.log('creator_id column already exists in bounties table');
    } else {
      console.log('Adding creator_id column to bounties table...');
      
      // SQLite doesn't support adding a column with NOT NULL constraint directly
      // So we need to:
      // 1. Add the column without NOT NULL
      // 2. Update existing rows to set creator_id
      // 3. Recreate the table with NOT NULL constraint (optional, but better for consistency)
      
      await runQuery(`
        ALTER TABLE bounties 
        ADD COLUMN creator_id TEXT
      `);
      
      console.log('creator_id column added');
      
      // Update existing rows - for existing bounties, we'll set creator_id based on creator username
      // First, let's get all users to map usernames to ids
      const users = await getAllRows('SELECT id, username FROM users');
      const usernameToId = {};
      users.forEach(user => {
        usernameToId[user.username] = user.id;
      });
      
      // Get all bounties
      const bounties = await getAllRows('SELECT id, creator FROM bounties');
      
      for (const bounty of bounties) {
        const creatorId = usernameToId[bounty.creator];
        if (creatorId) {
          await runQuery(
            'UPDATE bounties SET creator_id = ? WHERE id = ?',
            [creatorId, bounty.id]
          );
          console.log(`Updated bounty ${bounty.id} with creator_id ${creatorId}`);
        } else {
          console.warn(`Could not find user for creator: ${bounty.creator}`);
        }
      }
      
      console.log('Existing bounties updated');
    }
    
    // Also check and add other missing columns that might be needed
    const hasRewardPoints = tableInfo.some(col => col.name === 'reward_points');
    if (!hasRewardPoints) {
      console.log('Adding reward_points column...');
      await runQuery(`
        ALTER TABLE bounties 
        ADD COLUMN reward_points INTEGER DEFAULT 0
      `);
    }
    
    const hasAcceptedSolutionId = tableInfo.some(col => col.name === 'accepted_solution_id');
    if (!hasAcceptedSolutionId) {
      console.log('Adding accepted_solution_id column...');
      await runQuery(`
        ALTER TABLE bounties 
        ADD COLUMN accepted_solution_id TEXT
      `);
    }
    
    const hasAcceptedUserId = tableInfo.some(col => col.name === 'accepted_user_id');
    if (!hasAcceptedUserId) {
      console.log('Adding accepted_user_id column...');
      await runQuery(`
        ALTER TABLE bounties 
        ADD COLUMN accepted_user_id TEXT
      `);
    }
    
    const hasPublishLayer = tableInfo.some(col => col.name === 'publish_layer');
    if (!hasPublishLayer) {
      console.log('Adding publish_layer column...');
      await runQuery(`
        ALTER TABLE bounties 
        ADD COLUMN publish_layer TEXT
      `);
    }
    
    const hasPublishCommunityId = tableInfo.some(col => col.name === 'publish_community_id');
    if (!hasPublishCommunityId) {
      console.log('Adding publish_community_id column...');
      await runQuery(`
        ALTER TABLE bounties 
        ADD COLUMN publish_community_id TEXT
      `);
    }
    
    const hasPublishCategoryId = tableInfo.some(col => col.name === 'publish_category_id');
    if (!hasPublishCategoryId) {
      console.log('Adding publish_category_id column...');
      await runQuery(`
        ALTER TABLE bounties 
        ADD COLUMN publish_category_id TEXT
      `);
    }
    
    // Also check if the status constraint includes 'in_review'
    // We can't easily alter the CHECK constraint, but we can verify the current statuses are valid
    
    console.log('Bounties table migration completed successfully!');
    
    // Verify the final table structure
    const finalTableInfo = await getAllRows("PRAGMA table_info(bounties)");
    console.log('\nFinal bounties table structure:');
    finalTableInfo.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
    });
    
  } catch (error) {
    console.error('Error migrating bounties table:', error);
    throw error;
  }
};

// Main
(async () => {
  try {
    await migrateBountiesTable();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
