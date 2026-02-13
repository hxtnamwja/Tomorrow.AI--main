import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';

const router = Router();

const mapBountyRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    reward: row.reward,
    layer: row.layer,
    communityId: row.community_id || undefined,
    status: row.status,
    creator: row.creator,
    createdAt: row.created_at
  };
};

const requireUser = async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
    return null;
  }
  return user;
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

// GET /bounties
router.get('/', async (req, res) => {
  const { layer, communityId, status } = req.query;
  
  try {
    if (layer === 'community' && !communityId) {
      return res.status(400).json({ code: 400, message: 'communityId is required for community layer', data: null });
    }
    if (layer === 'community') {
      const user = await requireUser(req, res);
      if (!user) return;
      if (user.role !== 'general_admin') {
        const isMember = await isCommunityMember(communityId, user.id);
        if (!isMember) {
          return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
        }
      }
    }
    let query = 'SELECT * FROM bounties WHERE 1=1';
    const params = [];
    
    if (layer) {
      query += ' AND layer = ?';
      params.push(layer);
    }
    
    if (communityId) {
      query += ' AND community_id = ?';
      params.push(communityId);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const bounties = await getAllRows(query, params);
    res.json({ code: 200, message: 'Success', data: bounties.map(mapBountyRow) });
  } catch (error) {
    console.error('Error fetching bounties:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /bounties
router.post('/', async (req, res) => {
  const { title, description, reward, layer, communityId } = req.body;
  const user = await requireUser(req, res);
  
  if (!user) {
    return;
  }
  
  const id = 'bounty-' + Date.now();
  const now = Date.now();
  
  try {
    await runQuery(`
      INSERT INTO bounties (id, title, description, reward, layer, community_id, status, creator, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, title, description, reward, layer, communityId || null, 'open', user.username, now]);
    
    const bounty = await getRow('SELECT * FROM bounties WHERE id = ?', [id]);
    res.json({ code: 200, message: 'Success', data: mapBountyRow(bounty) });
  } catch (error) {
    console.error('Error creating bounty:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /bounties/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  
  try {
    const result = await runQuery('UPDATE bounties SET status = ? WHERE id = ?', [status, req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Bounty not found', data: null });
    }
    
    const bounty = await getRow('SELECT * FROM bounties WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Success', data: mapBountyRow(bounty) });
  } catch (error) {
    console.error('Error updating bounty status:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /bounties/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery('DELETE FROM bounties WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Bounty not found', data: null });
    }
    
    res.json({ code: 200, message: 'Deleted successfully', data: null });
  } catch (error) {
    console.error('Error deleting bounty:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
