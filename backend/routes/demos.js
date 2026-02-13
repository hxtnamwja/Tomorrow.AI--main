import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';
import multer from 'multer';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

const router = Router();

const mapDemoRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    layer: row.layer,
    communityId: row.community_id || undefined,
    code: row.code,
    author: row.author,
    thumbnailUrl: row.thumbnail_url || undefined,
    status: row.status,
    createdAt: row.created_at,
    rejectionReason: row.rejection_reason || undefined,
    bountyId: row.bounty_id || undefined,
    likeCount: row.like_count || 0,
    projectType: row.project_type || 'single-file',
    entryFile: row.entry_file || undefined,
    projectSize: row.project_size || 0
  };
};

const isCommunityMember = async (communityId, userId) => {
  const member = await getRow(
    'SELECT id FROM community_members WHERE community_id = ? AND user_id = ? AND status = ?',
    [communityId, userId, 'member']
  );
  return !!member;
};

// Helper to get current user from token
const getCurrentUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return await getRow('SELECT * FROM users WHERE id = ?', [payload.userId]);
  } catch (e) {
    return null;
  }
};

// GET /demos
router.get('/', async (req, res) => {
  const { layer, communityId, categoryId, search, status, authorId, sortBy } = req.query;

  // Always include like count in the query
  let query = `
    SELECT d.*, COUNT(l.id) as like_count 
    FROM demos d 
    LEFT JOIN demo_likes l ON d.id = l.demo_id 
    WHERE 1=1
  `;
  const params = [];

  if (layer === 'community' && !communityId) {
    return res.status(400).json({ code: 400, message: 'communityId is required for community layer', data: null });
  }

  if (layer === 'community') {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
    }
    if (user.role !== 'general_admin') {
      const isMember = await isCommunityMember(communityId, user.id);
      if (!isMember) {
        return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
      }
    }
  }

  if (layer) {
    query += ' AND d.layer = ?';
    params.push(layer);
  }

  if (communityId) {
    query += ' AND d.community_id = ?';
    params.push(communityId);
  }

  if (categoryId) {
    query += ' AND d.category_id = ?';
    params.push(categoryId);
  }

  if (search) {
    query += ' AND (d.title LIKE ? OR d.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    query += ' AND d.status = ?';
    params.push(status);
  }

  if (authorId) {
    query += ' AND d.author = ?';
    params.push(authorId);
  }

  // Group by demo id
  query += ' GROUP BY d.id';

  // Support sorting by likes or creation date
  if (sortBy === 'likes') {
    query += ' ORDER BY like_count DESC, d.created_at DESC';
  } else {
    query += ' ORDER BY d.created_at DESC';
  }

  try {
    const demos = await getAllRows(query, params);
    res.json({ code: 200, message: 'Success', data: demos.map(mapDemoRow) });
  } catch (error) {
    console.error('Error fetching demos:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /demos
router.post('/', async (req, res) => {
  const { title, description, categoryId, layer, communityId, code, bountyId } = req.body;
  
  const user = await getCurrentUser(req);
  // Always use the current logged-in user's username as author
  const resolvedAuthor = user ? user.username : 'Anonymous';
  
  const id = 'demo-' + Date.now();
  const now = Date.now();
  
  try {
    await runQuery(`
      INSERT INTO demos (id, title, description, category_id, layer, community_id, code, author, status, bounty_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, title, description, categoryId, layer, communityId || null, code, resolvedAuthor, 'pending', bountyId || null, now]);
    
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [id]);
    res.json({ code: 200, message: 'Success', data: mapDemoRow(demo) });
  } catch (error) {
    console.error('Error creating demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /demos/:id
router.get('/:id', async (req, res) => {
  try {
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    
    if (!demo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    res.json({ code: 200, message: 'Success', data: mapDemoRow(demo) });
  } catch (error) {
    console.error('Error fetching demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /demos/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status, rejectionReason } = req.body;
  
  try {
    const result = await runQuery(`
      UPDATE demos SET status = ?, rejection_reason = ? WHERE id = ?
    `, [status, rejectionReason || null, req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Success', data: mapDemoRow(demo) });
  } catch (error) {
    console.error('Error updating demo status:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /demos/:id/cover
router.patch('/:id/cover', async (req, res) => {
  const { thumbnailUrl } = req.body;
  
  try {
    const result = await runQuery('UPDATE demos SET thumbnail_url = ? WHERE id = ?', 
      [thumbnailUrl, req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Success', data: mapDemoRow(demo) });
  } catch (error) {
    console.error('Error updating demo cover:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /demos/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery('DELETE FROM demos WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    res.json({ code: 200, message: 'Deleted successfully', data: null });
  } catch (error) {
    console.error('Error deleting demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// ==================== LIKE ROUTES ====================

// GET /demos/:id/likes - Get like count and user's like status
router.get('/:id/likes', async (req, res) => {
  const demoId = req.params.id;
  const user = await getCurrentUser(req);
  
  try {
    // Get total like count
    const countResult = await getRow(
      'SELECT COUNT(*) as count FROM demo_likes WHERE demo_id = ?',
      [demoId]
    );
    
    // Check if current user has liked
    let userLiked = false;
    if (user) {
      const userLike = await getRow(
        'SELECT id FROM demo_likes WHERE demo_id = ? AND user_id = ?',
        [demoId, user.id]
      );
      userLiked = !!userLike;
    }
    
    res.json({
      code: 200,
      message: 'Success',
      data: {
        count: countResult?.count || 0,
        userLiked
      }
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /demos/:id/like - Like a demo
router.post('/:id/like', async (req, res) => {
  const demoId = req.params.id;
  const user = await getCurrentUser(req);
  
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }
  
  try {
    // Check if already liked
    const existingLike = await getRow(
      'SELECT id FROM demo_likes WHERE demo_id = ? AND user_id = ?',
      [demoId, user.id]
    );
    
    if (existingLike) {
      return res.status(400).json({ code: 400, message: 'Already liked', data: null });
    }
    
    // Add like
    await runQuery(
      'INSERT INTO demo_likes (demo_id, user_id, created_at) VALUES (?, ?, ?)',
      [demoId, user.id, Date.now()]
    );
    
    // Get updated count
    const countResult = await getRow(
      'SELECT COUNT(*) as count FROM demo_likes WHERE demo_id = ?',
      [demoId]
    );
    
    res.json({
      code: 200,
      message: 'Liked successfully',
      data: {
        count: countResult?.count || 0,
        userLiked: true
      }
    });
  } catch (error) {
    console.error('Error liking demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /demos/:id/like - Unlike a demo
router.delete('/:id/like', async (req, res) => {
  const demoId = req.params.id;
  const user = await getCurrentUser(req);
  
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }
  
  try {
    // Remove like
    await runQuery(
      'DELETE FROM demo_likes WHERE demo_id = ? AND user_id = ?',
      [demoId, user.id]
    );
    
    // Get updated count
    const countResult = await getRow(
      'SELECT COUNT(*) as count FROM demo_likes WHERE demo_id = ?',
      [demoId]
    );
    
    res.json({
      code: 200,
      message: 'Unliked successfully',
      data: {
        count: countResult?.count || 0,
        userLiked: false
      }
    });
  } catch (error) {
    console.error('Error unliking demo:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /demos/liked/by/:userId - Get all demos liked by a user
router.get('/liked/by/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const demos = await getAllRows(`
      SELECT d.* FROM demos d
      JOIN demo_likes l ON d.id = l.demo_id
      WHERE l.user_id = ? AND d.status = 'published'
      ORDER BY l.created_at DESC
    `, [userId]);
    
    res.json({ code: 200, message: 'Success', data: demos.map(mapDemoRow) });
  } catch (error) {
    console.error('Error fetching liked demos:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// ==================== ZIP UPLOAD ROUTES ====================

// 配置multer用于文件上传
const upload = multer({
  dest: 'uploads/temp/',
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || 
        file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传ZIP文件'));
    }
  }
});

// POST /demos/upload-zip - 上传ZIP项目
router.post('/upload-zip', upload.single('zipFile'), async (req, res) => {
  const { title, description, categoryId, layer, communityId } = req.body;
  const user = await getCurrentUser(req);
  
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }
  
  if (!req.file) {
    return res.status(400).json({ code: 400, message: 'No file uploaded', data: null });
  }
  
  const demoId = 'demo-' + Date.now();
  const projectDir = path.join('projects', demoId);
  
  try {
    // 创建项目目录
    fs.mkdirSync(projectDir, { recursive: true });
    
    // 解压ZIP文件
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(projectDir, true);
    
    // 分析项目结构
    const projectInfo = analyzeProjectStructure(projectDir);
    
    if (!projectInfo.entryFiles.length) {
      // 清理
      fs.rmSync(projectDir, { recursive: true });
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        code: 400, 
        message: 'ZIP中未找到HTML文件', 
        data: null 
      });
    }
    
    // 保存到数据库
    await runQuery(`
      INSERT INTO demos (id, title, description, category_id, layer, community_id, 
                       code, author, status, project_type, entry_file, project_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      demoId,
      title,
      description,
      categoryId,
      layer,
      communityId || null,
      projectInfo.entryFiles[0], // 存储入口文件相对路径
      user.username,
      'pending',
      'multi-file',
      projectInfo.entryFiles[0],
      projectInfo.totalSize,
      Date.now()
    ]);
    
    // 清理临时文件
    fs.unlinkSync(req.file.path);
    
    res.json({ 
      code: 200, 
      message: '上传成功', 
      data: { 
        id: demoId, 
        entryFile: projectInfo.entryFiles[0],
        structure: projectInfo.structure,
        size: projectInfo.totalSize
      }
    });
  } catch (error) {
    console.error('Upload ZIP error:', error);
    // 清理可能创建的文件
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true });
    }
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// GET /demos/:id/structure - 获取项目结构
router.get('/:id/structure', async (req, res) => {
  try {
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    
    if (!demo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    if (demo.project_type !== 'multi-file') {
      return res.status(400).json({ 
        code: 400, 
        message: '此演示不是多文件项目', 
        data: null 
      });
    }
    
    const projectDir = path.join('projects', demo.id);
    
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ 
        code: 404, 
        message: '项目文件不存在', 
        data: null 
      });
    }
    
    const projectInfo = analyzeProjectStructure(projectDir);
    
    res.json({ 
      code: 200, 
      message: 'Success', 
      data: projectInfo 
    });
  } catch (error) {
    console.error('Get project structure error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /demos/:id/files/:filepath - 获取项目文件内容
router.get('/:id/files/*', async (req, res) => {
  try {
    const demo = await getRow('SELECT * FROM demos WHERE id = ?', [req.params.id]);
    
    if (!demo) {
      return res.status(404).json({ code: 404, message: 'Demo not found', data: null });
    }
    
    if (demo.project_type !== 'multi-file') {
      return res.status(400).json({ 
        code: 400, 
        message: '此演示不是多文件项目', 
        data: null 
      });
    }
    
    const filepath = req.params[0] || '';
    const projectDir = path.join('projects', demo.id);
    const fullPath = path.join(projectDir, filepath);
    
    // 安全检查
    const normalizedPath = path.normalize(fullPath);
    const normalizedProjectDir = path.normalize(projectDir);
    
    if (!normalizedPath.startsWith(normalizedProjectDir)) {
      return res.status(403).json({ code: 403, message: '访问被拒绝', data: null });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ code: 404, message: '文件不存在', data: null });
    }
    
    // 读取文件内容
    const content = fs.readFileSync(fullPath, 'utf-8');
    const ext = path.extname(filepath).toLowerCase();
    
    // 根据文件类型返回
    if (['.html', '.htm', '.css', '.js', '.json', '.txt', '.md'].includes(ext)) {
      res.json({ 
        code: 200, 
        message: 'Success', 
        data: { 
          path: filepath,
          content: content,
          extension: ext
        } 
      });
    } else {
      res.status(400).json({ 
        code: 400, 
        message: '不支持的文件类型', 
        data: null 
      });
    }
  } catch (error) {
    console.error('Get file content error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// 辅助函数：分析项目结构
function analyzeProjectStructure(dir) {
  const structure = [];
  const entryFiles = [];
  const imageFiles = [];
  let totalSize = 0;
  
  function scanDirectory(currentDir, basePath = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      // 过滤掉系统隐藏文件和目录
      if (entry.name === '__MACOSX' || entry.name.startsWith('.') || entry.name === '.DS_Store') {
        continue;
      }
      
      const relativePath = path.join(basePath, entry.name);
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        structure.push({
          type: 'directory',
          path: relativePath,
          name: entry.name
        });
        scanDirectory(fullPath, relativePath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        const fileStats = fs.statSync(fullPath);
        
        structure.push({
          type: 'file',
          path: relativePath,
          name: entry.name,
          size: fileStats.size,
          extension: ext
        });
        
        totalSize += fileStats.size;
        
        // 收集HTML入口文件
        if (ext === '.html' || ext === '.htm') {
          entryFiles.push(relativePath);
        }
        
        // 收集图片文件
        if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico'].includes(ext)) {
          imageFiles.push({
            path: relativePath,
            name: entry.name,
            size: fileStats.size
          });
        }
      }
    }
  }
  
  scanDirectory(dir);
  
  return {
    structure,
    entryFiles,
    imageFiles,
    totalSize
  };
}

export default router;
