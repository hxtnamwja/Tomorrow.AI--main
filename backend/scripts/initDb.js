import { initDatabase, runQuery, getAllRows } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = initDatabase();

// Create tables
const createTables = async () => {
  // Users table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'general_admin')),
      created_at INTEGER NOT NULL
    )
  `);

  // Communities table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS communities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      creator_id TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at INTEGER NOT NULL,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // Community members table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS community_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('member', 'pending')),
      joined_at INTEGER NOT NULL,
      UNIQUE(community_id, user_id),
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Categories table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      community_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
    )
  `);

  // Demos table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS demos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category_id TEXT NOT NULL,
      layer TEXT NOT NULL CHECK(layer IN ('general', 'community')),
      community_id TEXT,
      code TEXT NOT NULL,
      author TEXT NOT NULL,
      thumbnail_url TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'published', 'rejected')),
      rejection_reason TEXT,
      bounty_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
    )
  `);

  // Bounties table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS bounties (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      reward TEXT NOT NULL,
      layer TEXT NOT NULL CHECK(layer IN ('general', 'community')),
      community_id TEXT,
      status TEXT NOT NULL CHECK(status IN ('open', 'closed')),
      creator TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
    )
  `);

  // Likes table - for demo likes
  await runQuery(`
    CREATE TABLE IF NOT EXISTS demo_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demo_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(demo_id, user_id),
      FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Tables created successfully');
};

// Seed initial data
const seedData = async () => {
  const now = Date.now();
  const adminId = 'admin-001';
  const userId = 'user-101';

  // Insert seed users
  try {
    await runQuery('INSERT OR IGNORE INTO users (id, username, role, created_at) VALUES (?, ?, ?, ?)', 
      [adminId, 'admin', 'general_admin', now]);
    await runQuery('INSERT OR IGNORE INTO users (id, username, role, created_at) VALUES (?, ?, ?, ?)', 
      [userId, 'researcher', 'user', now]);
    console.log('Seed users inserted');
  } catch (err) {
    console.log('Users already exist');
  }

  // Insert seed categories for general layer
  const categories = [
    { id: 'cat-physics', name: 'Physics' },
    { id: 'cat-chemistry', name: 'Chemistry' },
    { id: 'cat-mathematics', name: 'Mathematics' },
    { id: 'cat-biology', name: 'Biology' },
    { id: 'cat-computer-science', name: 'Computer Science' },
    { id: 'cat-astronomy', name: 'Astronomy' },
    { id: 'cat-earth-science', name: 'Earth Science' },
    { id: 'cat-creative-tools', name: 'Creative Tools' }
  ];

  for (const cat of categories) {
    try {
      await runQuery('INSERT OR IGNORE INTO categories (id, name, parent_id, community_id, created_at) VALUES (?, ?, ?, ?, ?)', 
        [cat.id, cat.name, null, null, now]);
    } catch (err) {}
  }
  console.log('Seed categories inserted');

  // Insert seed bounty
  try {
    await runQuery(`
      INSERT OR IGNORE INTO bounties (id, title, description, reward, layer, community_id, status, creator, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'b-1',
      'Viscous Fluid Simulation',
      'We need a high-performance visual of fluid dynamics with adjustable viscosity parameters.',
      '$200 Grant',
      'general',
      null,
      'open',
      'Admin',
      now
    ]);
    console.log('Seed bounty inserted');
  } catch (err) {}

  // Insert seed demo
  const seedDemoCode = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; background: #0f172a; }
    canvas { display: block; }
    .controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 15px 25px;
      border-radius: 30px;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div class="controls">Wave Interference Simulation</div>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let time = 0;
    function animate() {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const r = 100 + Math.sin(time + i * 0.2) * 30;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(' + (200 + i * 2) + ', 70%, 60%)';
        ctx.fill();
      }
      
      time += 0.05;
      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>`;

  try {
    await runQuery(`
      INSERT OR IGNORE INTO demos (id, title, description, category_id, layer, community_id, code, author, thumbnail_url, status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'demo-001',
      'Wave Interference Pattern',
      'A visualization of wave interference patterns showing constructive and destructive interference.',
      'cat-physics',
      'general',
      null,
      seedDemoCode,
      'Dr. Smith',
      null,
      'published',
      now
    ]);
    console.log('Seed demo inserted');
  } catch (err) {}
};

// Main
(async () => {
  try {
    await createTables();
    await seedData();
    console.log('\n✅ Database initialized successfully!');
    console.log('Seed data inserted.');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
})();
