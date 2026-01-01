import axios from 'axios';
import { AuthResponse, RegisterRequest, AuthRequest } from '@trading-platform/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  login: async (data: AuthRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
};

export const tradingApi = {
  placeOrder: async (order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'STOP_MARKET';
    quantity: number;
    price?: number;
  }) => {
    const response = await api.post('/api/trading/orders', order);
    return response.data;
  },
  
  getOrders: async () => {
    const response = await api.get('/api/trading/orders');
    return response.data;
  },
  
  getPositions: async () => {
    const response = await api.get('/api/trading/positions');
    return response.data;
  },
};

export default api;
