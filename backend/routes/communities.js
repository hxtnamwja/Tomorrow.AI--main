import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';

const router = Router();

const mapCommunityRow = async (row) => {
  if (!row) return null;
  const members = await getAllRows(
    'SELECT user_id FROM community_members WHERE community_id = ? AND status = ?',
    [row.id, 'member']
  );
  const pendingMembers = await getAllRows(
    'SELECT user_id FROM community_members WHERE community_id = ? AND status = ?',
    [row.id, 'pending']
  );
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    creatorId: row.creator_id,
    code: row.code,
    status: row.status,
    members: members.map((m) => m.user_id),
    pendingMembers: pendingMembers.map((m) => m.user_id),
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

// Helper to generate 12-digit code
const generateCode = () => Math.random().toString().slice(2, 14);

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

// GET /communities
router.get('/', async (req, res) => {
  const { status, userId } = req.query;
  
  try {
    let query = `
      SELECT c.*
      FROM communities c
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    
    if (userId) {
      query += ' AND c.id IN (SELECT community_id FROM community_members WHERE user_id = ? AND status = "member")';
      params.push(userId);
    }
    
    query += ' ORDER BY c.created_at DESC';
    
    const communities = await getAllRows(query, params);
    const data = await Promise.all(communities.map((c) => mapCommunityRow(c)));
    res.json({ code: 200, message: 'Success', data });
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /communities
router.post('/', async (req, res) => {
  const { name, description } = req.body;
  const user = await requireUser(req, res);
  
  if (!user) {
    return;
  }
  
  const id = 'comm-' + Date.now();
  const code = generateCode();
  const now = Date.now();
  
  try {
    await runQuery(`
      INSERT INTO communities (id, name, description, creator_id, code, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, name, description, user.id, code, 'pending', now]);
    
    // Creator is automatically a member
    await runQuery(`
      INSERT INTO community_members (community_id, user_id, status, joined_at)
      VALUES (?, ?, ?, ?)
    `, [id, user.id, 'member', now]);
    
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [id]);
    res.json({ code: 200, message: 'Success', data: await mapCommunityRow(community) });
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /communities/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const user = await requireUser(req, res);
  
  if (!user) {
    return;
  }
  
  if (user.role !== 'general_admin') {
    return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
  }
  
  try {
    const result = await runQuery('UPDATE communities SET status = ? WHERE id = ?', [status, req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }
    
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Success', data: await mapCommunityRow(community) });
  } catch (error) {
    console.error('Error updating community status:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /communities/join-by-code
router.post('/join-by-code', async (req, res) => {
  const { code } = req.body;
  const user = await requireUser(req, res);
  
  if (!user) {
    return;
  }
  
  try {
    const community = await getRow('SELECT * FROM communities WHERE code = ? AND status = "approved"', [code]);
    
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Invalid code or community not approved', data: null });
    }
    
    // Check if already a member
    const existing = await getRow('SELECT * FROM community_members WHERE community_id = ? AND user_id = ?', 
      [community.id, user.id]);
    
    if (existing) {
      if (existing.status === 'member') {
        return res.json({ code: 200, message: 'Already a member', data: community });
      }
      // Update pending to member
      await runQuery('UPDATE community_members SET status = ? WHERE id = ?', ['member', existing.id]);
    } else {
      await runQuery('INSERT INTO community_members (community_id, user_id, status, joined_at) VALUES (?, ?, ?, ?)',
        [community.id, user.id, 'member', Date.now()]);
    }
    
    res.json({ code: 200, message: 'Joined successfully', data: await mapCommunityRow(community) });
  } catch (error) {
    console.error('Error joining community:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /communities/:id/join-request
router.post('/:id/join-request', async (req, res) => {
  const user = await requireUser(req, res);
  
  if (!user) {
    return;
  }
  
  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }
    
    // Check if already member or pending
    const existing = await getRow('SELECT * FROM community_members WHERE community_id = ? AND user_id = ?', 
      [req.params.id, user.id]);
    
    if (existing) {
      return res.json({ code: 200, message: 'Request already submitted', data: null });
    }
    
    await runQuery('INSERT INTO community_members (community_id, user_id, status, joined_at) VALUES (?, ?, ?, ?)',
      [req.params.id, user.id, 'pending', Date.now()]);
    
    res.json({ code: 200, message: 'Request submitted', data: null });
  } catch (error) {
    console.error('Error requesting to join:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /communities/:id/members/manage
router.post('/:id/members/manage', async (req, res) => {
  const { userId, action } = req.body;
  const user = await requireUser(req, res);
  
  if (!user) {
    return;
  }
  
  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }
    // Check permissions based on action
    if (action === 'kick') {
      // Only creator can kick members
      if (community.creator_id !== user.id) {
        return res.status(403).json({ code: 403, message: 'Only community creator can kick members', data: null });
      }
      // Cannot kick creator
      if (userId === community.creator_id) {
        return res.status(400).json({ code: 400, message: 'Cannot kick community creator', data: null });
      }
    } else {
      // For accept/reject_request, general_admin can also assist
      if (community.creator_id !== user.id && user.role !== 'general_admin') {
        return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
      }
    }
    const member = await getRow('SELECT * FROM community_members WHERE community_id = ? AND user_id = ?', 
      [req.params.id, userId]);
    
    if (!member) {
      return res.status(404).json({ code: 404, message: 'Member not found', data: null });
    }
    
    if (action === 'accept') {
      await runQuery('UPDATE community_members SET status = ? WHERE id = ?', ['member', member.id]);
    } else if (action === 'kick' || action === 'reject_request') {
      await runQuery('DELETE FROM community_members WHERE id = ?', [member.id]);
    }
    
    res.json({ code: 200, message: 'Success', data: null });
  } catch (error) {
    console.error('Error managing member:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /communities/:id/members
router.get('/:id/members', async (req, res) => {
  try {
    const members = await getAllRows(`
      SELECT u.id, u.username, cm.status, cm.joined_at
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.community_id = ?
    `, [req.params.id]);
    
    res.json({ code: 200, message: 'Success', data: members });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /communities/:id/code
router.patch('/:id/code', async (req, res) => {
  const newCode = generateCode();
  const user = await requireUser(req, res);
  
  if (!user) {
    return;
  }
  
  try {
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }
    if (community.creator_id !== user.id) {
      return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
    }
    const result = await runQuery('UPDATE communities SET code = ? WHERE id = ?', [newCode, req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }
    
    res.json({ code: 200, message: 'Success', data: { code: newCode } });
  } catch (error) {
    console.error('Error updating code:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /communities/:id - Update community info (name, description, etc.)
router.patch('/:id', async (req, res) => {
  const { name, description, members, pendingMembers } = req.body;
  const user = await requireUser(req, res);
  
  if (!user) {
    return;
  }
  
  try {
    // Check if community exists
    const community = await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id]);
    if (!community) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }
    
    // Only creator can update community
    if (community.creator_id !== user.id) {
      return res.status(403).json({ code: 403, message: 'Only creator can update community', data: null });
    }
    
    // Update basic info if provided
    if (name !== undefined || description !== undefined) {
      const updates = [];
      const params = [];
      
      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      
      if (updates.length > 0) {
        params.push(req.params.id);
        await runQuery(`UPDATE communities SET ${updates.join(', ')} WHERE id = ?`, params);
      }
    }
    
    // Update members if provided (for member management)
    if (members !== undefined && Array.isArray(members)) {
      // Get current members from database
      const currentMembers = await getAllRows(
        'SELECT user_id FROM community_members WHERE community_id = ? AND status = ?',
        [req.params.id, 'member']
      );
      const currentMemberIds = currentMembers.map(m => m.user_id);
      
      // Find members to remove (in current but not in new list)
      const membersToRemove = currentMemberIds.filter(id => !members.includes(id));
      for (const memberId of membersToRemove) {
        await runQuery(
          'DELETE FROM community_members WHERE community_id = ? AND user_id = ?',
          [req.params.id, memberId]
        );
      }
    }
    
    // Update pending members if provided (for join request management)
    if (pendingMembers !== undefined && Array.isArray(pendingMembers)) {
      // Get current pending members
      const currentPending = await getAllRows(
        'SELECT user_id FROM community_members WHERE community_id = ? AND status = ?',
        [req.params.id, 'pending']
      );
      const currentPendingIds = currentPending.map(m => m.user_id);
      
      // Find pending members to remove (rejected requests)
      const pendingToRemove = currentPendingIds.filter(id => !pendingMembers.includes(id));
      for (const memberId of pendingToRemove) {
        await runQuery(
          'DELETE FROM community_members WHERE community_id = ? AND user_id = ? AND status = ?',
          [req.params.id, memberId, 'pending']
        );
      }
    }
    
    // Return updated community
    const updatedCommunity = await mapCommunityRow(
      await getRow('SELECT * FROM communities WHERE id = ?', [req.params.id])
    );
    
    res.json({ code: 200, message: 'Updated successfully', data: updatedCommunity });
  } catch (error) {
    console.error('Error updating community:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /communities/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery('DELETE FROM communities WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: 'Community not found', data: null });
    }
    
    res.json({ code: 200, message: 'Deleted successfully', data: null });
  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
