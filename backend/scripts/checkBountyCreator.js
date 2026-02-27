import { initDatabase, getAllRows, getRow } from '../database.js';

const db = initDatabase();

const checkDb = async () => {
  try {
    console.log('检查bounties表数据...\n');
    const bounties = await getAllRows('SELECT * FROM bounties');
    console.log(`bounties表有 ${bounties.length} 条记录`);
    bounties.forEach(bounty => {
      console.log('\n-------------------------');
      console.log('Bounty ID:', bounty.id);
      console.log('Title:', bounty.title);
      console.log('Creator:', bounty.creator);
      console.log('Creator ID:', bounty.creator_id);
      console.log('Status:', bounty.status);
    });

    console.log('\n\n检查users表数据...');
    const users = await getAllRows('SELECT id, username FROM users');
    console.log(`users表有 ${users.length} 条记录`);
    users.forEach(user => {
      console.log(`- User ID: ${user.id}, Username: ${user.username}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('检查失败:', error);
    process.exit(1);
  }
};

checkDb();
