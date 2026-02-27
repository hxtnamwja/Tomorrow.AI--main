import { initDatabase, runQuery, getAllRows } from '../database.js';

const db = initDatabase();

const migrateDatabase = async () => {
  console.log('开始迁移数据库...\n');

  try {
    // 1. 检查users表是否有community_points字段
    const usersTableInfo = await getAllRows("PRAGMA table_info(users)");
    const hasCommunityPoints = usersTableInfo.some(col => col.name === 'community_points');
    
    if (!hasCommunityPoints) {
      console.log('添加users表的community_points字段...');
      await runQuery('ALTER TABLE users ADD COLUMN community_points INTEGER DEFAULT 0');
      console.log('✓ community_points字段添加成功\n');
    } else {
      console.log('✓ users表的community_points字段已存在\n');
    }

    // 2. 检查bounties表的字段
    const bountiesTableInfo = await getAllRows("PRAGMA table_info(bounties)");
    const bountiesColumns = bountiesTableInfo.map(col => col.name);
    
    const requiredBountyColumns = [
      'reward_points',
      'accepted_solution_id',
      'accepted_user_id',
      'publish_layer',
      'publish_community_id',
      'publish_category_id'
    ];
    
    for (const col of requiredBountyColumns) {
      if (!bountiesColumns.includes(col)) {
        console.log(`添加bounties表的${col}字段...`);
        let defaultValue = '';
        if (col === 'reward_points') {
          defaultValue = 'INTEGER DEFAULT 0';
        } else {
          defaultValue = 'TEXT';
        }
        await runQuery(`ALTER TABLE bounties ADD COLUMN ${col} ${defaultValue}`);
        console.log(`✓ ${col}字段添加成功\n`);
      } else {
        console.log(`✓ bounties表的${col}字段已存在\n`);
      }
    }

    // 3. 检查bounty_solutions表是否存在
    const tables = await getAllRows("SELECT name FROM sqlite_master WHERE type='table' AND name='bounty_solutions'");
    
    if (tables.length === 0) {
      console.log('创建bounty_solutions表...');
      await runQuery(`
        CREATE TABLE bounty_solutions (
          id TEXT PRIMARY KEY,
          bounty_id TEXT NOT NULL,
          demo_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          username TEXT NOT NULL,
          submitted_at INTEGER NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')),
          rejection_reason TEXT,
          reviewed_at INTEGER,
          FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE CASCADE,
          FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE
        )
      `);
      console.log('✓ bounty_solutions表创建成功\n');
    } else {
      console.log('✓ bounty_solutions表已存在\n');
    }

    // 4. 更新现有用户的社区积分
    console.log('更新现有用户的社区积分...');
    await runQuery("UPDATE users SET community_points = 500 WHERE community_points = 0 OR community_points IS NULL");
    console.log('✓ 用户积分更新成功\n');

    console.log('\n✅ 数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 数据库迁移失败:', error);
    process.exit(1);
  }
};

migrateDatabase();
