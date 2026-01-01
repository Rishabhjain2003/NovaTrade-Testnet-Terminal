import dotenv from 'dotenv';
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
import { OrderCommand, OrderEvent } from '@trading-platform/shared';
import { executeBinanceOrder } from './binance';
import { decryptApiKey } from './utils/encryption';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const prisma = new PrismaClient();

const redisOptions = {
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
};

const redisSubscriber = createClient(redisOptions);
const redisPublisher = createClient(redisOptions);

async function main() {
  // Connect Redis clients with error handling
  try {
    await redisSubscriber.connect();
    await redisPublisher.connect();
    console.log('Execution Service: Redis connected');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }

  // Subscribe to order commands
  await redisSubscriber.subscribe('commands:order:submit', async (message) => {
    try {
      const orderCommand: OrderCommand = JSON.parse(message);
      console.log('📦 Received order command:', orderCommand.orderId);

      await processOrder(orderCommand);
    } catch (error) {
      console.error('Error processing order command:', error);
    }
  });

  console.log('🚀 Execution Service listening for order commands...');
}

async function processOrder(orderCommand: OrderCommand) {
  try {
    // Fetch user's Binance API keys from database
    const user = await prisma.user.findUnique({
      where: { id: orderCommand.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Decrypt API keys
    const apiKey = decryptApiKey(user.binanceApiKey);
    const secretKey = decryptApiKey(user.binanceSecretKey);

    // Execute order on Binance
    const result = await executeBinanceOrder(
      orderCommand,
      apiKey,
      secretKey
    );

    // Create success event
    const orderEvent: OrderEvent = {
      orderId: orderCommand.orderId,
      userId: orderCommand.userId,
      status: result.status === 'FILLED' ? 'FILLED' : 'PARTIALLY_FILLED',
      symbol: orderCommand.symbol,
      side: orderCommand.side,
      quantity: orderCommand.quantity,
      executedQty: result.executedQty,
      price: result.price,
      binanceOrderId: result.orderId,
      timestamp: new Date().toISOString(),
    };

    // Save to database
    await prisma.orderEvent.create({
      data: {
        orderId: orderEvent.orderId,
        userId: orderEvent.userId,
        status: orderEvent.status,
        symbol: orderEvent.symbol,
        side: orderEvent.side,
        quantity: orderEvent.quantity,
        executedQty: orderEvent.executedQty,
        price: orderEvent.price,
        binanceOrderId: orderEvent.binanceOrderId,
        timestamp: new Date(orderEvent.timestamp),
      },
    });

    // Update order command status
    await prisma.orderCommand.update({
      where: { orderId: orderCommand.orderId },
      data: { status: orderEvent.status },
    });

    // Publish event to Redis
    await redisPublisher.publish(
      'events:order:status',
      JSON.stringify(orderEvent)
    );

    console.log('Order executed:', orderEvent.orderId, orderEvent.status);
  } catch (error: any) {
    console.error('Order execution failed:', error.message);

    // Create failure event
    const orderEvent: OrderEvent = {
      orderId: orderCommand.orderId,
      userId: orderCommand.userId,
      status: 'REJECTED',
      symbol: orderCommand.symbol,
      side: orderCommand.side,
      quantity: orderCommand.quantity,
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    // Save failure to database
    await prisma.orderEvent.create({
      data: {
        orderId: orderEvent.orderId,
        userId: orderEvent.userId,
        status: orderEvent.status,
        symbol: orderEvent.symbol,
        side: orderEvent.side,
        quantity: orderEvent.quantity,
        error: orderEvent.error,
        timestamp: new Date(orderEvent.timestamp),
      },
    });

    // Update order command status
    await prisma.orderCommand.update({
      where: { orderId: orderCommand.orderId },
      data: { status: 'REJECTED' },
    });

    // Publish failure event
    await redisPublisher.publish(
      'events:order:status',
      JSON.stringify(orderEvent)
    );
  }
}

main().catch(console.error);
