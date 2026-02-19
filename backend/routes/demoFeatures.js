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

router.post('/:demoId/data', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const { demoId } = req.params;
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ code: 400, message: 'Missing required fields', data: null });
    }

    const existing = await getRow(
      'SELECT id FROM demo_user_data WHERE demo_id = ? AND user_id = ? AND data_key = ?',
      [demoId, user?.id || 'guest', key]
    );

    if (existing) {
      await runQuery(
        'UPDATE demo_user_data SET data_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(value), existing.id]
      );
    } else {
      await runQuery(
        'INSERT INTO demo_user_data (demo_id, user_id, data_key, data_value) VALUES (?, ?, ?, ?)',
        [demoId, user?.id || 'guest', key, JSON.stringify(value)]
      );
    }

    res.json({ code: 200, message: 'Data saved successfully', data: null });
  } catch (error) {
    console.error('Save data error:', error);
    res.status(500).json({ code: 500, message: 'Internal server error', data: null });
  }
});

router.get('/:demoId/data/:key', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const { demoId, key } = req.params;

    const data = await getRow(
      'SELECT data_value FROM demo_user_data WHERE demo_id = ? AND user_id = ? AND data_key = ?',
      [demoId, user?.id || 'guest', key]
    );

    if (data) {
      res.json({ code: 200, message: 'Success', data: JSON.parse(data.data_value) });
    } else {
      res.json({ code: 200, message: 'Success', data: null });
    }
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ code: 500, message: 'Internal server error', data: null });
  }
});

router.get('/:demoId/data', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const { demoId } = req.params;

    const dataList = await getAllRows(
      'SELECT data_key, data_value, updated_at FROM demo_user_data WHERE demo_id = ? AND user_id = ?',
      [demoId, user?.id || 'guest']
    );

    const result = {};
    dataList.forEach(item => {
      result[item.data_key] = {
        value: JSON.parse(item.data_value),
        updatedAt: item.updated_at
      };
    });

    res.json({ code: 200, message: 'Success', data: result });
  } catch (error) {
    console.error('Get all data error:', error);
    res.status(500).json({ code: 500, message: 'Internal server error', data: null });
  }
});

router.post('/:demoId/rooms', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const { demoId } = req.params;
    const { title, maxPlayers = 4 } = req.body;

    const roomId = await runQuery(
      'INSERT INTO demo_rooms (demo_id, creator_id, title, max_players, status) VALUES (?, ?, ?, ?, ?)',
      [demoId, user?.id, title || '协作空间', maxPlayers, 'waiting']
    );

    res.json({ code: 200, message: 'Room created successfully', data: { roomId } });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ code: 500, message: 'Internal server error', data: null });
  }
});

router.get('/:demoId/rooms', async (req, res) => {
  try {
    const { demoId } = req.params;

    const rooms = await getAllRows(
      'SELECT r.*, (SELECT COUNT(*) FROM demo_room_members WHERE room_id = r.id) as player_count, u.username as creator_name FROM demo_rooms r LEFT JOIN users u ON r.creator_id = u.id WHERE r.demo_id = ? AND r.status IN (?, ?) ORDER BY r.created_at DESC',
      [demoId, 'waiting', 'playing']
    );

    res.json({ code: 200, message: 'Success', data: rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ code: 500, message: 'Internal server error', data: null });
  }
});

router.post('/:demoId/rooms/:roomId/join', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const { demoId, roomId } = req.params;

    const room = await getRow('SELECT * FROM demo_rooms WHERE id = ? AND demo_id = ?', [roomId, demoId]);
    if (!room) {
      return res.status(404).json({ code: 404, message: 'Room not found', data: null });
    }

    const playerCount = await getRow(
      'SELECT COUNT(*) as count FROM demo_room_members WHERE room_id = ?',
      [roomId]
    );

    if (playerCount.count >= room.max_players) {
      return res.status(400).json({ code: 400, message: 'Room is full', data: null });
    }

    const existing = await getRow(
      'SELECT id FROM demo_room_members WHERE room_id = ? AND user_id = ?',
      [roomId, user?.id]
    );

    if (!existing) {
      await runQuery(
        'INSERT INTO demo_room_members (room_id, user_id, role) VALUES (?, ?, ?)',
        [roomId, user?.id, user?.id === room.creator_id ? 'host' : 'player']
      );
    }

    res.json({ code: 200, message: 'Joined room successfully', data: null });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ code: 500, message: 'Internal server error', data: null });
  }
});

router.post('/:demoId/rooms/:roomId/leave', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const { demoId, roomId } = req.params;

    await runQuery(
      'DELETE FROM demo_room_members WHERE room_id = ? AND user_id = ?',
      [roomId, user?.id]
    );

    res.json({ code: 200, message: 'Left room successfully', data: null });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ code: 500, message: 'Internal server error', data: null });
  }
});

router.post('/:demoId/rooms/:roomId/message', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const { demoId, roomId } = req.params;
    const { type, data } = req.body;

    await runQuery(
      'INSERT INTO demo_room_messages (room_id, user_id, message_type, message_data) VALUES (?, ?, ?, ?)',
      [roomId, user?.id, type || 'update', JSON.stringify(data)]
    );

    res.json({ code: 200, message: 'Message sent successfully', data: null });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ code: 500, message: 'Internal server error', data: null });
  }
});

router.get('/:demoId/rooms/:roomId/messages', async (req, res) => {
  try {
    const { demoId, roomId } = req.params;
    const { since } = req.query;

    let query = 'SELECT m.*, u.username FROM demo_room_messages m LEFT JOIN users u ON m.user_id = u.id WHERE m.room_id = ?';
    const params = [roomId];

    if (since) {
      query += ' AND m.created_at > ?';
      params.push(since);
    }

    query += ' ORDER BY m.created_at ASC LIMIT 100';

    const messages = await getAllRows(query, params);

    res.json({ 
      code: 200, 
      message: 'Success', 
      data: messages.map(m => ({
        ...m,
        data: JSON.parse(m.message_data)
      }))
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ code: 500, message: 'Internal server error', data: null });
  }
});

export default router;
