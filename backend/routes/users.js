import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';

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
    creatorId: row.creator_id || undefined,
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

const router = Router();

// Helper to get user from auth header
const getUserFromAuth = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const user = await getRow('SELECT * FROM users WHERE id = ?', [payload.userId]);
    return user;
  } catch {
    return null;
  }
};

// GET /users - Get all users (general admin only)
router.get('/', async (req, res) => {
  const currentUser = await getUserFromAuth(req);
  if (!currentUser || currentUser.role !== 'general_admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }

  try {
    const users = await getAllRows(`
      SELECT id, username, role, created_at, is_banned, ban_reason, contact_info, bio 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json({ code: 200, message: 'Success', data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /users/public - Get public user list (all users, no auth required)
router.get('/public', async (req, res) => {
  try {
    const users = await getAllRows(`
      SELECT id, username, role, created_at, contact_info, bio 
      FROM users 
      WHERE is_banned = 0
      ORDER BY created_at DESC
    `);
    res.json({ code: 200, message: 'Success', data: users });
  } catch (error) {
    console.error('Get public users error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /users/community/:communityId - Get users in a community (community admin or general admin)
router.get('/community/:communityId', async (req, res) => {
  const currentUser = await getUserFromAuth(req);
  if (!currentUser) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { communityId } = req.params;

  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [communityId]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }

    // Check if user is general admin or community creator
    if (currentUser.role !== 'general_admin' && community.creator_id !== currentUser.id) {
      return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
    }

    const members = await getAllRows(`
      SELECT u.id, u.username, u.role, u.created_at, u.is_banned, u.ban_reason, u.contact_info, u.bio,
             cm.status as membership_status
      FROM users u
      INNER JOIN community_members cm ON u.id = cm.user_id
      WHERE cm.community_id = ?
      ORDER BY u.created_at DESC
    `, [communityId]);

    res.json({ code: 200, message: 'Success', data: members });
  } catch (error) {
    console.error('Get community users error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /users/:id - Get a specific user by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await getRow(`
      SELECT id, username, role, created_at, is_banned, ban_reason, contact_info, payment_qr, bio
      FROM users 
      WHERE id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found', data: null });
    }

    res.json({ code: 200, message: 'Success', data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PUT /users/:id/ban - Ban a user (general admin only)
router.put('/:id/ban', async (req, res) => {
  const currentUser = await getUserFromAuth(req);
  if (!currentUser || currentUser.role !== 'general_admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (id === currentUser.id) {
    return res.status(400).json({ code: 400, message: 'Cannot ban yourself', data: null });
  }

  try {
    const user = await getRow('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found', data: null });
    }

    if (user.role === 'general_admin') {
      return res.status(403).json({ code: 403, message: 'Cannot ban another admin', data: null });
    }

    await runQuery('UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?', [reason || null, id]);
    res.json({ code: 200, message: 'User banned successfully', data: null });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PUT /users/:id/unban - Unban a user (general admin only)
router.put('/:id/unban', async (req, res) => {
  const currentUser = await getUserFromAuth(req);
  if (!currentUser || currentUser.role !== 'general_admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }

  const { id } = req.params;

  try {
    await runQuery('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?', [id]);
    res.json({ code: 200, message: 'User unbanned successfully', data: null });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PUT /users/:id - Update user profile
router.put('/:id', async (req, res) => {
  const currentUser = await getUserFromAuth(req);
  if (!currentUser) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { id } = req.params;
  const { username, password, contactInfo, paymentQr, bio } = req.body;

  if (id !== currentUser.id && currentUser.role !== 'general_admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }

  try {
    let updates = [];
    let params = [];

    if (username) {
      const existing = await getRow('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
      if (existing) {
        return res.status(400).json({ code: 400, message: 'Username already exists', data: null });
      }
      updates.push('username = ?');
      params.push(username);
    }

    if (password) {
      updates.push('password = ?');
      params.push(password);
    }

    if (contactInfo !== undefined) {
      updates.push('contact_info = ?');
      params.push(contactInfo || null);
    }

    if (paymentQr !== undefined) {
      updates.push('payment_qr = ?');
      params.push(paymentQr || null);
    }

    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio || null);
    }

    if (updates.length > 0) {
      params.push(id);
      await runQuery(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const updatedUser = await getRow(`
      SELECT id, username, role, created_at, is_banned, ban_reason, contact_info, payment_qr, bio
      FROM users WHERE id = ?
    `, [id]);

    res.json({ code: 200, message: 'User updated successfully', data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /users/:id/stats - Get user stats (demos created, communities managed)
router.get('/:id/stats', async (req, res) => {
  const { id } = req.params;

  try {
    // First, get the user to know their username
    const user = await getRow('SELECT id, username FROM users WHERE id = ?', [id]);
    
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found', data: null });
    }

    // Count demos by creator_id if available, otherwise by author (username)
    const demosCountResult = await getRow(`
      SELECT COUNT(*) as count FROM demos 
      WHERE (creator_id = ? OR author = ?)
    `, [id, user.username]);
    
    const demosCount = demosCountResult.count;

    const communitiesManaged = await getAllRows('SELECT * FROM communities WHERE creator_id = ?', [id]);
    const likedDemos = await getAllRows(`
      SELECT d.* FROM demos d
      INNER JOIN demo_likes dl ON d.id = dl.demo_id
      WHERE dl.user_id = ?
    `, [id]);

    const mappedLikedDemos = likedDemos.map(mapDemoRow);

    res.json({
      code: 200,
      message: 'Success',
      data: {
        demosCount,
        communitiesCount: communitiesManaged.length,
        communitiesManaged,
        likedDemos: mappedLikedDemos
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /users/:id/demos - Get all demos by user
router.get('/:id/demos', async (req, res) => {
  const { id } = req.params;

  try {
    // First, get the user to know their username
    const user = await getRow('SELECT id, username FROM users WHERE id = ?', [id]);
    
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found', data: null });
    }

    // Get demos by creator_id if available, otherwise by author (username)
    const demos = await getAllRows(`
      SELECT * FROM demos 
      WHERE (creator_id = ? OR author = ?) AND status = 'published'
      ORDER BY created_at DESC
    `, [id, user.username]);

    const mappedDemos = demos.map(mapDemoRow);
    res.json({ code: 200, message: 'Success', data: mappedDemos });
  } catch (error) {
    console.error('Get user demos error:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
