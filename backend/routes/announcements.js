import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';

const router = Router();

const mapAnnouncementRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    type: row.type,
    layer: row.layer,
    communityId: row.community_id || undefined,
    createdBy: row.created_by,
    createdByUsername: row.created_by_username || undefined,
    createdAt: row.created_at,
    expiresAt: row.expires_at || undefined,
    isActive: row.is_active === 1
  };
};

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

const requireUser = async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
    return null;
  }
  return user;
};

// GET /announcements - Get all active announcements
router.get('/', async (req, res) => {
  try {
    const { layer, communityId } = req.query;
    const now = Date.now();
    
    let query = 'SELECT * FROM announcements WHERE is_active = 1';
    const params = [];
    
    if (layer) {
      query += ' AND layer = ?';
      params.push(layer);
    }
    
    if (communityId) {
      query += ' AND (type = ? OR (type = ? AND community_id = ?))';
      params.push('general', 'community', communityId);
    }
    
    query += ' AND (expires_at IS NULL OR expires_at > ?)';
    params.push(now);
    query += ' ORDER BY created_at DESC';
    
    const announcements = await getAllRows(query, params);
    res.json({ code: 200, message: 'Success', data: announcements.map(mapAnnouncementRow) });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// GET /announcements/all - Get all announcements (admin only)
router.get('/all', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    
    let announcements;
    
    if (user.role === 'general_admin') {
      announcements = await getAllRows('SELECT * FROM announcements ORDER BY created_at DESC');
    } else {
      const userCommunities = await getAllRows(
        'SELECT id FROM communities WHERE creator_id = ?',
        [user.id]
      );
      const communityIds = userCommunities.map(c => c.id);
      
      if (communityIds.length > 0) {
        const placeholders = communityIds.map(() => '?').join(',');
        announcements = await getAllRows(
          `SELECT * FROM announcements 
           WHERE created_by = ? OR (type = 'community' AND community_id IN (${placeholders}))
           ORDER BY created_at DESC`,
          [user.id, ...communityIds]
        );
      } else {
        announcements = await getAllRows(
          'SELECT * FROM announcements WHERE created_by = ? ORDER BY created_at DESC',
          [user.id]
        );
      }
    }
    
    res.json({ code: 200, message: 'Success', data: announcements.map(mapAnnouncementRow) });
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// POST /announcements - Create announcement
router.post('/', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    
    const {
      title,
      content,
      type,
      layer,
      communityId,
      expiresAt,
      isActive
    } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ code: 400, message: 'Title and content are required', data: null });
    }
    
    if (type === 'general' && user.role !== 'general_admin') {
      return res.status(403).json({ code: 403, message: 'Only general admin can create general announcements', data: null });
    }
    
    if (type === 'community') {
      if (!communityId) {
        return res.status(400).json({ code: 400, message: 'Community ID is required for community announcements', data: null });
      }
      
      const community = await getRow('SELECT * FROM communities WHERE id = ?', [communityId]);
      if (!community) {
        return res.status(404).json({ code: 404, message: 'Community not found', data: null });
      }
      
      if (user.role !== 'general_admin' && community.creator_id !== user.id) {
        return res.status(403).json({ code: 403, message: 'Only community admin can create announcements for this community', data: null });
      }
    }
    
    const id = 'ann-' + Date.now();
    const now = Date.now();
    
    await runQuery(`
      INSERT INTO announcements (
        id, title, content, type, layer, community_id,
        created_by, created_by_username, created_at, expires_at, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, title, content, type, layer, communityId || null,
      user.id, user.username, now, expiresAt || null, isActive !== false ? 1 : 0
    ]);
    
    const announcement = await getRow('SELECT * FROM announcements WHERE id = ?', [id]);
    res.json({ code: 200, message: 'Success', data: mapAnnouncementRow(announcement) });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// PATCH /announcements/:id - Toggle active status
router.patch('/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    
    const announcement = await getRow('SELECT * FROM announcements WHERE id = ?', [req.params.id]);
    if (!announcement) {
      return res.status(404).json({ code: 404, message: 'Announcement not found', data: null });
    }
    
    if (user.role !== 'general_admin') {
      if (announcement.type === 'general') {
        return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
      }
      
      if (announcement.community_id) {
        const community = await getRow('SELECT * FROM communities WHERE id = ?', [announcement.community_id]);
        if (!community || community.creator_id !== user.id) {
          return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
        }
      } else if (announcement.created_by !== user.id) {
        return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
      }
    }
    
    const { isActive } = req.body;
    await runQuery('UPDATE announcements SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, req.params.id]);
    
    const updatedAnnouncement = await getRow('SELECT * FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Success', data: mapAnnouncementRow(updatedAnnouncement) });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// DELETE /announcements/:id - Delete announcement
router.delete('/:id', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    
    const announcement = await getRow('SELECT * FROM announcements WHERE id = ?', [req.params.id]);
    if (!announcement) {
      return res.status(404).json({ code: 404, message: 'Announcement not found', data: null });
    }
    
    if (user.role !== 'general_admin') {
      if (announcement.type === 'general') {
        return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
      }
      
      if (announcement.community_id) {
        const community = await getRow('SELECT * FROM communities WHERE id = ?', [announcement.community_id]);
        if (!community || community.creator_id !== user.id) {
          return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
        }
      } else if (announcement.created_by !== user.id) {
        return res.status(403).json({ code: 403, message: 'Forbidden', data: null });
      }
    }
    
    await runQuery('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: 'Success', data: null });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
