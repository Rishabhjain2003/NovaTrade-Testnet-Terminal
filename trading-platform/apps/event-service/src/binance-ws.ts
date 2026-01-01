import WebSocket from 'ws';
import { WebSocketMessage } from '@trading-platform/shared';

const BINANCE_WS_URL = process.env.BINANCE_WS_URL || 'wss://stream.testnet.binance.vision';

export function setupBinancePriceStreams(clients: Map<string, WebSocket>) {
  // Binance testnet combined streams format
  const streams = [
    'btcusdt@ticker',
    'ethusdt@ticker',
  ];

  const combinedUrl = `${BINANCE_WS_URL}/stream?streams=${streams.join('/')}`;
  
  console.log('Connecting to:', combinedUrl);
  
  const ws = new WebSocket(combinedUrl);

  ws.on('open', () => {
    console.log('Connected to Binance Testnet price streams');
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Binance combined stream format
      if (message.stream && message.data) {
        const ticker = message.data;

        const priceUpdate: WebSocketMessage = {
          type: 'PRICE_UPDATE',
          data: {
            symbol: ticker.s,
            price: parseFloat(ticker.c),
            change: parseFloat(ticker.p),
            changePercent: parseFloat(ticker.P),
            high: parseFloat(ticker.h),
            low: parseFloat(ticker.l),
            volume: parseFloat(ticker.v),
          },
        };

        // Broadcast to all connected clients
        clients.forEach((clientWs) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(priceUpdate));
          }
        });
      }
    } catch (error) {
      console.error('Error processing Binance price update:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('Binance WS connection error:', error.message);
  });

  ws.on('close', () => {
    console.log('Binance WS connection closed, reconnecting...');
    setTimeout(() => setupBinancePriceStreams(clients), 5000);
  });
}
