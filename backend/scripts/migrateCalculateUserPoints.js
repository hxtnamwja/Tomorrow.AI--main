import { runQuery, getAllRows, getRow } from '../database.js';

console.log('Starting to calculate user points based on published demos...');

async function migrate() {
  try {
    // Get all users
    const users = await getAllRows('SELECT id, username FROM users');
    console.log(`Found ${users.length} users`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      // Count published demos by this user
      const demosResult = await getRow(`
        SELECT COUNT(*) as count 
        FROM demos 
        WHERE (creator_id = ? OR author = ?) AND status = 'published'
      `, [user.id, user.username]);
      
      const demoCount = demosResult.count || 0;
      
      if (demoCount > 0) {
        const contributionPoints = demoCount * 10;
        const points = demoCount * 10;
        
        console.log(`User ${user.username} (${user.id}): ${demoCount} published demos → ${contributionPoints} points`);
        
        await runQuery(
          'UPDATE users SET contribution_points = ?, points = ? WHERE id = ?',
          [contributionPoints, points, user.id]
        );
        
        updatedCount++;
      }
    }
    
    console.log(`\nUpdated ${updatedCount} users successfully!`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
