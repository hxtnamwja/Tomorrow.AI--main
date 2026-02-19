
import { WebSocketServer } from 'ws';
import http from 'http';
import url from 'url';

const rooms = new Map();
const clientRooms = new Map();

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  console.log('WebSocket server started');

  wss.on('connection', (ws, req) => {
    const queryParams = url.parse(req.url, true).query;
    const demoId = queryParams.demoId;
    const roomId = queryParams.roomId;
    const userId = queryParams.userId;

    console.log('New connection:', demoId, roomId, userId);

    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected'
    }));

    if (roomId) {
      joinRoom(ws, roomId, demoId, userId);
    }

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join':
            joinRoom(ws, message.roomId, message.demoId, message.userId);
            break;
          case 'leave':
            leaveRoom(ws);
            break;
          case 'broadcast':
            broadcastToRoom(ws, message.data);
            break;
          case 'message':
            sendToRoom(ws, message);
            break;
        }
      } catch (e) {
        console.error('WebSocket parse error:', e);
      }
    });

    ws.on('close', () => {
      console.log('Connection closed');
      leaveRoom(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

function joinRoom(ws, roomId, demoId, userId) {
  leaveRoom(ws);

  const roomKey = `${demoId}-${roomId}`;

  if (!rooms.has(roomKey)) {
    rooms.set(roomKey, {
      clients: new Set(),
      demoId: demoId,
      roomId: roomId,
      createdAt: Date.now()
    });
  }

  const room = rooms.get(roomKey);
  room.clients.add(ws);
  clientRooms.set(ws, roomKey);

  console.log('User joined room:', userId, demoId, roomId);

  broadcastToRoom(ws, {
    type: 'userJoined',
    userId: userId,
    userCount: room.clients.size
  }, true);
}

function leaveRoom(ws) {
  const roomKey = clientRooms.get(ws);
  if (roomKey && rooms.has(roomKey)) {
    const room = rooms.get(roomKey);
    room.clients.delete(ws);
    clientRooms.delete(ws);

    broadcastToRoom(ws, {
      type: 'userLeft',
      userCount: room.clients.size
    }, true);

    if (room.clients.size === 0) {
      rooms.delete(roomKey);
      console.log('Room deleted:', roomKey);
    }
  }
}

function broadcastToRoom(ws, data, includeSelf = false) {
  const roomKey = clientRooms.get(ws);
  if (!roomKey || !rooms.has(roomKey)) return;

  const room = rooms.get(roomKey);
  const message = JSON.stringify({
    type: 'broadcast',
    data: data,
    timestamp: Date.now()
  });

  room.clients.forEach(client => {
    if (client !== ws || includeSelf) {
      if (client.readyState === 1) {
        client.send(message);
      }
    }
  });
}

function sendToRoom(ws, message) {
  const roomKey = clientRooms.get(ws);
  if (!roomKey || !rooms.has(roomKey)) return;

  const room = rooms.get(roomKey);
  const fullMessage = JSON.stringify({
    type: 'message',
    from: message.from,
    data: message.data,
    timestamp: Date.now()
  });

  room.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(fullMessage);
    }
  });
}

export { rooms };
