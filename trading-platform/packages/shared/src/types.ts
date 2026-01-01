export interface User {
  id: string;
  email: string;
  binanceApiKey: string;
  binanceSecretKey: string;
  createdAt: Date;
}

export interface OrderCommand {
  orderId: string;
  userId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET';
  quantity: number;
  price?: number;
  timestamp: string;
}

export interface OrderEvent {
  orderId: string;
  userId: string;
  status: 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'REJECTED' | 'CANCELLED';
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  executedQty?: number;
  price?: number;
  binanceOrderId?: number;
  error?: string;
  timestamp: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface WebSocketMessage {
  type: 'ORDER_UPDATE' | 'POSITION_UPDATE' | 'PRICE_UPDATE';
  data: any;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  binanceApiKey: string;
  binanceSecretKey: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}
