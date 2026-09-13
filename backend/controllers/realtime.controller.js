// controllers/realtime.controller.js
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { realtimeService } from '../services/realtime.service.js';

export function streamEvents(req, res) {
  // Extract token from query param (standard for EventSource) or Bearer header
  let token = req.query.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required for real-time stream.' });
  }

  let decodedUser;
  try {
    decodedUser = jwt.verify(
      token,
      process.env.JWT_SECRET || 'crddms_jwt_secret_key_2026'
    );
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }

  // Set mandatory SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
  });

  const clientId = `client_${Date.now()}_${uuidv4().substring(0, 8)}`;
  realtimeService.addClient(clientId, res, decodedUser, req);
}

export function getRealtimeStatus(_req, res) {
  res.json({
    success: true,
    activeConnections: realtimeService.getActiveClientsCount(),
    timestamp: new Date().toISOString(),
  });
}
