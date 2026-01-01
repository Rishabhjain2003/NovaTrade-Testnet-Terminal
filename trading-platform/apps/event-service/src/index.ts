import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { OrderEvent, WebSocketMessage } from '@trading-platform/shared';
import { setupBinancePriceStreams } from './binance-ws';

dotenv.config();

const WS_PORT = parseInt(process.env.WS_PORT || '3002');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisSubscriber = createClient({
  url: REDIS_URL,
  socket: {
    keepAlive: 5000,
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error('Redis: Too many reconnection attempts');
        return new Error('Too many retries');
      }
      return retries * 500;
    },
  },
});

// Store connected clients by userId
const clients = new Map<string, WebSocket>();

async function main() {
  // Connect Redis with error handling
  try {
    await redisSubscriber.connect();
    console.log('Event Service: Redis connected');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }

  // Create WebSocket server
  const wss = new WebSocketServer({ port: WS_PORT });
  console.log(`🚀 WebSocket server running on port ${WS_PORT}`);

  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    // Extract token from query params
    const url = new URL(req.url!, `http://localhost:${WS_PORT}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Token required');
      return;
    }

    try {
      // Verify JWT
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.userId;

      console.log(`Client connected: ${userId}`);

      // Store client connection
      clients.set(userId, ws);

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`Client disconnected: ${userId}`);
        clients.delete(userId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${userId}:`, error.message);
      });

      // Send connection confirmation
      ws.send(JSON.stringify({ type: 'CONNECTED', data: { userId } }));
    } catch (error) {
      console.error('Invalid token:', error);
      ws.close(1008, 'Invalid token');
    }
  });

  // Subscribe to order events from Redis
  await redisSubscriber.subscribe('events:order:status', (message) => {
    try {
      const orderEvent: OrderEvent = JSON.parse(message);
      console.log('📨 Broadcasting order event:', orderEvent.orderId);

      // Send to specific user
      const userWs = clients.get(orderEvent.userId);
      if (userWs && userWs.readyState === WebSocket.OPEN) {
        const wsMessage: WebSocketMessage = {
          type: 'ORDER_UPDATE',
          data: orderEvent,
        };
        userWs.send(JSON.stringify(wsMessage));
      }
    } catch (error) {
      console.error('Error broadcasting order event:', error);
    }
  });

  // Setup Binance price streams
  setupBinancePriceStreams(clients);
}

main().catch(console.error);
