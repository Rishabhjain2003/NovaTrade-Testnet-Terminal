import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { OrderCommand } from '@trading-platform/shared';
import { authenticateToken } from '../middleware/auth';
import { redisPublisher } from '../services/redis';

const router = Router();
const prisma = new PrismaClient();

// Place order
router.post('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { symbol, side, type, quantity, price } = req.body;

    // Validate input
    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['BUY', 'SELL'].includes(side)) {
      return res.status(400).json({ error: 'Invalid side' });
    }

    if (!['MARKET', 'LIMIT', 'STOP_MARKET'].includes(type)) {
      return res.status(400).json({ error: 'Invalid order type' });
    }

    // Generate order ID
    const orderId = uuidv4();

    // Create order command
    const orderCommand: OrderCommand = {
      orderId,
      userId,
      symbol,
      side,
      type,
      quantity: parseFloat(quantity),
      price: price ? parseFloat(price) : undefined,
      timestamp: new Date().toISOString(),
    };

    // Save to database
    await prisma.orderCommand.create({
      data: {
        orderId,
        userId,
        symbol,
        side,
        type,
        quantity: parseFloat(quantity),
        price: price ? parseFloat(price) : null,
        status: 'PENDING',
      },
    });

    // Publish to Redis (DO NOT execute directly)
    await redisPublisher.publish(
      'commands:order:submit',
      JSON.stringify(orderCommand)
    );

    res.json({
      orderId,
      status: 'PENDING',
      message: 'Order submitted for execution',
    });
  } catch (error) {
    console.error('Order submission error:', error);
    res.status(500).json({ error: 'Order submission failed' });
  }
});

// Get all orders for user
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const orders = await prisma.orderEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get positions
router.get('/positions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Get all filled orders
    const filledOrders = await prisma.orderEvent.findMany({
      where: {
        userId,
        status: 'FILLED',
      },
    });

    // Calculate positions
    const positionsMap = new Map<string, any>();

    for (const order of filledOrders) {
      const existing = positionsMap.get(order.symbol) || {
        symbol: order.symbol,
        quantity: 0,
        totalCost: 0,
      };

      const qty = order.executedQty || order.quantity;
      const price = order.price || 0;

      if (order.side === 'BUY') {
        existing.quantity += qty;
        existing.totalCost += qty * price;
      } else {
        existing.quantity -= qty;
        existing.totalCost -= qty * price;
      }

      positionsMap.set(order.symbol, existing);
    }

    const positions = Array.from(positionsMap.values())
      .filter((p) => Math.abs(p.quantity) > 0.0001)
      .map((p) => ({
        symbol: p.symbol,
        quantity: p.quantity,
        avgEntryPrice: p.totalCost / p.quantity,
        unrealizedPnl: 0, // Will be calculated with real-time prices
        realizedPnl: 0,
      }));

    res.json(positions);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

export default router;
