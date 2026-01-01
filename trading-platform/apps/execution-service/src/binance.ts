import axios from 'axios';
import crypto from 'crypto';
import { OrderCommand } from '@trading-platform/shared';

const BINANCE_TESTNET_URL = process.env.BINANCE_TESTNET_URL || 'https://testnet.binance.vision';

interface BinanceOrderResponse {
  orderId: number;
  status: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  fills: Array<{
    price: string;
    qty: string;
  }>;
}

export async function executeBinanceOrder(
  orderCommand: OrderCommand,
  apiKey: string,
  secretKey: string
) {
  const timestamp = Date.now();

  // Build order params
  const params: any = {
    symbol: orderCommand.symbol,
    side: orderCommand.side,
    type: orderCommand.type,
    timestamp,
  };

  // Add quantity
  if (orderCommand.type === 'MARKET') {
    params.quantity = orderCommand.quantity.toFixed(8);
  } else if (orderCommand.type === 'LIMIT') {
    params.quantity = orderCommand.quantity.toFixed(8);
    params.price = orderCommand.price?.toFixed(8);
    params.timeInForce = 'GTC';
  }

  // Create signature
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('hex');

  // Make API request
  const response = await axios.post<BinanceOrderResponse>(
    `${BINANCE_TESTNET_URL}/api/v3/order`,
    null,
    {
      params: {
        ...params,
        signature,
      },
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    }
  );

  // Calculate average price
  let avgPrice = 0;
  if (response.data.fills && response.data.fills.length > 0) {
    const totalValue = response.data.fills.reduce(
      (sum, fill) => sum + parseFloat(fill.price) * parseFloat(fill.qty),
      0
    );
    const totalQty = response.data.fills.reduce(
      (sum, fill) => sum + parseFloat(fill.qty),
      0
    );
    avgPrice = totalValue / totalQty;
  }

  return {
    orderId: response.data.orderId,
    status: response.data.status,
    executedQty: parseFloat(response.data.executedQty),
    price: avgPrice,
  };
}
