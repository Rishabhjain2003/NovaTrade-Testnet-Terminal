import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisPublisher = createClient({ 
  url: REDIS_URL,
  socket: {
    keepAlive: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis: Too many reconnection attempts');
        return new Error('Too many retries');
      }
      return retries * 500;
    },
  },
});

redisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err.message));
redisPublisher.on('connect', () => console.log('🔄 Redis Publisher connecting...'));
redisPublisher.on('ready', () => console.log('Redis Publisher connected'));

redisPublisher.connect().catch((err) => {
  console.error('Failed to connect Redis Publisher:', err);
  process.exit(1);
});
