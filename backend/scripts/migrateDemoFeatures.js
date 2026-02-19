import { getDatabase, runQuery } from '../database.js';

const migrate = async () => {
  console.log('开始迁移演示程序功能数据库...');
  
  try {
    const db = getDatabase();

    // 1. 创建用户数据表
    console.log('创建 demo_user_data 表...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS demo_user_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        demo_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        data_key TEXT NOT NULL,
        data_value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(demo_id, user_id, data_key)
      )
    `);

    // 2. 创建房间表
    console.log('创建 demo_rooms 表...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS demo_rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        demo_id TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        title TEXT NOT NULL,
        max_players INTEGER DEFAULT 4,
        status TEXT DEFAULT 'waiting',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. 创建房间成员表
    console.log('创建 demo_room_members 表...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS demo_room_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'player',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES demo_rooms(id) ON DELETE CASCADE,
        UNIQUE(room_id, user_id)
      )
    `);

    // 4. 创建房间消息表
    console.log('创建 demo_room_messages 表...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS demo_room_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        message_type TEXT DEFAULT 'update',
        message_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES demo_rooms(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ 数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
};

migrate();
