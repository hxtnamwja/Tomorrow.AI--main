import { initDatabase, runQuery, getRow, getAllRows } from '../database.js';

const db = initDatabase();

const migrateAnnouncements = async () => {
  console.log('开始迁移公告表...\n');

  try {
    const tables = await getAllRows("SELECT name FROM sqlite_master WHERE type='table' AND name='announcements'");
    
    if (tables.length === 0) {
      console.log('创建announcements表...');
      await runQuery(`
        CREATE TABLE announcements (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('general', 'community')),
          layer TEXT NOT NULL CHECK(layer IN ('general', 'community')),
          community_id TEXT,
          created_by TEXT NOT NULL,
          created_by_username TEXT,
          created_at INTEGER NOT NULL,
          expires_at INTEGER,
          is_active INTEGER DEFAULT 1,
          FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
        )
      `);
      console.log('✓ announcements表创建成功\n');
    } else {
      console.log('✓ announcements表已存在\n');
    }

    console.log('✅ 公告表迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 公告表迁移失败:', error);
    process.exit(1);
  }
};

migrateAnnouncements();
