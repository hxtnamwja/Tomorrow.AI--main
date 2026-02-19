import { Router } from 'express';
import { runQuery, getRow, getAllRows } from '../database.js';

const router = Router();

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

const generateId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

// ==================== DATA STORAGE ====================

router.get('/demos/:demoId/data', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  try {
    const data = await getAllRows(
      'SELECT * FROM demo_data_storage WHERE demo_id = ? AND user_id = ?',
      [req.params.demoId, user.id]
    );

    const formattedData = {};
    data.forEach(item => {
      let value;
      try {
        value = JSON.parse(item.data_value);
      } catch {
        value = item.data_value;
      }
      formattedData[item.data_key] = value;
    });

    res.json({ code: 200, message: 'Success', data: formattedData });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.post('/demos/:demoId/data', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { key, value, type = 'string' } = req.body;
  const now = Date.now();
  const id = generateId();

  try {
    const dataValue = typeof value === 'string' ? value : JSON.stringify(value);

    await runQuery(`
      INSERT OR REPLACE INTO demo_data_storage 
      (id, demo_id, user_id, data_key, data_value, data_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, req.params.demoId, user.id, key, dataValue, type, now, now]);

    res.json({ code: 200, message: 'Data saved successfully', data: null });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.delete('/demos/:demoId/data/:key', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  try {
    await runQuery(
      'DELETE FROM demo_data_storage WHERE demo_id = ? AND user_id = ? AND data_key = ?',
      [req.params.demoId, user.id, req.params.key]
    );

    res.json({ code: 200, message: 'Data deleted successfully', data: null });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

// ==================== MULTIPLAYER ROOMS ====================

router.get('/demos/:demoId/rooms', async (req, res) => {
  try {
    const rooms = await getAllRows(`
      SELECT r.*, 
             (SELECT COUNT(*) FROM demo_room_members WHERE room_id = r.id) as player_count
      FROM demo_rooms r
      WHERE r.demo_id = ? AND r.status = 'waiting'
      ORDER BY r.created_at DESC
    `, [req.params.demoId]);

    res.json({ code: 200, message: 'Success', data: rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.post('/demos/:demoId/rooms', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  const { roomName, maxPlayers = 2 } = req.body;
  const now = Date.now();
  const roomId = generateId();

  try {
    await runQuery(`
      INSERT INTO demo_rooms (id, demo_id, creator_id, room_name, max_players, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [roomId, req.params.demoId, user.id, roomName, maxPlayers, 'waiting', now]);

    await runQuery(`
      INSERT INTO demo_room_members (id, room_id, user_id, username, joined_at, is_host)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [generateId(), roomId, user.id, user.username, now, 1]);

    res.json({ code: 200, message: 'Room created successfully', data: { roomId } });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.post('/rooms/:roomId/join', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  try {
    const room = await getRow('SELECT * FROM demo_rooms WHERE id = ?', [req.params.roomId]);
    if (!room) {
      return res.status(404).json({ code: 404, message: 'Room not found', data: null });
    }

    const memberCount = await getRow(
      'SELECT COUNT(*) as count FROM demo_room_members WHERE room_id = ?',
      [req.params.roomId]
    );

    if (memberCount.count >= room.max_players) {
      return res.status(400).json({ code: 400, message: 'Room is full', data: null });
    }

    const existingMember = await getRow(
      'SELECT * FROM demo_room_members WHERE room_id = ? AND user_id = ?',
      [req.params.roomId, user.id]
    );

    if (existingMember) {
      return res.status(400).json({ code: 400, message: 'Already in room', data: null });
    }

    await runQuery(`
      INSERT INTO demo_room_members (id, room_id, user_id, username, joined_at, is_host)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [generateId(), req.params.roomId, user.id, user.username, Date.now(), 0]);

    const members = await getAllRows(
      'SELECT * FROM demo_room_members WHERE room_id = ?',
      [req.params.roomId]
    );

    res.json({ code: 200, message: 'Joined room successfully', data: { members } });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.post('/rooms/:roomId/leave', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ code: 401, message: 'Unauthorized', data: null });
  }

  try {
    await runQuery(
      'DELETE FROM demo_room_members WHERE room_id = ? AND user_id = ?',
      [req.params.roomId, user.id]
    );

    const memberCount = await getRow(
      'SELECT COUNT(*) as count FROM demo_room_members WHERE room_id = ?',
      [req.params.roomId]
    );

    if (memberCount.count === 0) {
      await runQuery('DELETE FROM demo_rooms WHERE id = ?', [req.params.roomId]);
    }

    res.json({ code: 200, message: 'Left room successfully', data: null });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

router.get('/rooms/:roomId/members', async (req, res) => {
  try {
    const members = await getAllRows(
      'SELECT * FROM demo_room_members WHERE room_id = ? ORDER BY joined_at',
      [req.params.roomId]
    );

    res.json({ code: 200, message: 'Success', data: members });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ code: 500, message: 'Server error', data: null });
  }
});

export default router;
