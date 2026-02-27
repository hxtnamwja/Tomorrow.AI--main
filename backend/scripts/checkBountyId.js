import { initDatabase, getAllRows } from '../database.js';

const db = initDatabase();

const checkDb = async () => {
  try {
    console.log('检查demos表结构...\n');
    const demosTableInfo = await getAllRows("PRAGMA table_info(demos)");
    console.log('demos表的字段：');
    demosTableInfo.forEach(col => {
      console.log(`- ${col.name}: ${col.type}`);
    });

    console.log('\n检查bounty_solutions表是否有数据...');
    const solutions = await getAllRows('SELECT * FROM bounty_solutions');
    console.log(`bounty_solutions表有 ${solutions.length} 条记录`);
    if (solutions.length > 0) {
      console.log('记录：', solutions);
    }

    process.exit(0);
  } catch (error) {
    console.error('检查失败:', error);
    process.exit(1);
  }
};

checkDb();
