import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';

// Import routes
import authRoutes from './routes/auth.js';
import demoRoutes from './routes/demos.js';
import communityRoutes from './routes/communities.js';
import categoryRoutes from './routes/categories.js';
import bountyRoutes from './routes/bounties.js';
import aiRoutes from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initDatabase();

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

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/demos', demoRoutes);
app.use('/api/v1/communities', communityRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/bounties', bountyRoutes);
app.use('/api/v1/ai', aiRoutes);

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
