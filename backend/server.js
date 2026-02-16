import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import path from 'path';
import fs from 'fs';

// Import routes
import authRoutes from './routes/auth.js';
import demoRoutes from './routes/demos.js';
import communityRoutes from './routes/communities.js';
import categoryRoutes from './routes/categories.js';
import bountyRoutes from './routes/bounties.js';
import aiRoutes from './routes/ai.js';
import usersRoutes from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initDatabase();

// 确保projects目录存在
const projectsDir = path.join(process.cwd(), 'projects');
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

// 确保uploads目录存在
const uploadsDir = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: true, // Allow all origins (reflects request origin)
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 静态文件服务 - 用于多文件项目的资源
app.use('/projects', express.static(projectsDir, {
  setHeaders: (res, filePath) => {
    // 设置正确的MIME类型
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
    
    // 缓存控制
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1天
    
    // 安全设置
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
  fallthrough: false
}));

// 安全中间件 - 防止路径遍历攻击
app.use('/projects', (req, res, next) => {
  const requestedPath = path.normalize(req.path);
  
  // 确保路径不以..开头
  if (requestedPath.startsWith('..') || requestedPath.includes('/../')) {
    return res.status(403).json({ code: 403, message: '访问被拒绝', data: null });
  }
  
  const fullPath = path.join(projectsDir, requestedPath);
  
  // 确保请求的路径在projects目录内
  if (!fullPath.startsWith(projectsDir)) {
    return res.status(403).json({ code: 403, message: '访问被拒绝', data: null });
  }
  
  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/demos', demoRoutes);
app.use('/api/v1/communities', communityRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/bounties', bountyRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/users', usersRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ code: 200, message: 'OK', data: { timestamp: Date.now() } });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    code: 500,
    message: 'Internal Server Error',
    data: null
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'Not Found',
    data: null
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🧪 Tomorrow Backend Server                           ║
║                                                        ║
║   Status: Running                                      ║
║   Port: ${PORT}                                          ║
║   API Base: http://0.0.0.0:${PORT}/api/v1                ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});
