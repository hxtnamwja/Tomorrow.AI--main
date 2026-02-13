import { initDatabase, runQuery } from '../database.js';
import fs from 'fs';

const db = initDatabase();

const migrateDatabase = async () => {
  console.log('开始数据库迁移...');
  
  try {
    // 检查字段是否已存在
    const tableInfo = await runQuery('PRAGMA table_info(demos)');
    const columns = Array.isArray(tableInfo) ? tableInfo.map(row => row.name) : [];
    
    console.log('当前demos表字段:', columns);
    
    // 添加project_type字段
    if (!columns.includes('project_type')) {
      await runQuery(`ALTER TABLE demos ADD COLUMN project_type TEXT DEFAULT 'single-file' CHECK(project_type IN ('single-file', 'multi-file'))`);
      console.log('✓ 添加project_type字段');
    } else {
      console.log('- project_type字段已存在');
    }
    
    // 添加entry_file字段
    if (!columns.includes('entry_file')) {
      await runQuery(`ALTER TABLE demos ADD COLUMN entry_file TEXT`);
      console.log('✓ 添加entry_file字段');
    } else {
      console.log('- entry_file字段已存在');
    }
    
    // 添加project_size字段
    if (!columns.includes('project_size')) {
      await runQuery(`ALTER TABLE demos ADD COLUMN project_size INTEGER`);
      console.log('✓ 添加project_size字段');
    } else {
      console.log('- project_size字段已存在');
    }
    
    console.log('\n✅ 数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  }
};

migrateDatabase();