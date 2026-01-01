'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import OrderEntry from '@/components/OrderEntry';
import OrdersTable from '@/components/OrdersTable';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const TradingChart = dynamic(() => import('@/components/TradingChart'), {
  ssr: false,
});

export default function TradePage() {
  const router = useRouter();
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [orderUpdate, setOrderUpdate] = useState(0);
  const { connected, lastMessage } = useWebSocket();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'PRICE_UPDATE' && lastMessage.data.symbol === symbol) {
        const newPrice = lastMessage.data.price;
        setCurrentPrice(newPrice);
        setPriceChange(lastMessage.data.changePercent);
        
        window.dispatchEvent(new CustomEvent('priceUpdate', {
          detail: {
            symbol: lastMessage.data.symbol,
            price: newPrice,
          }
        }));
      } else if (lastMessage.type === 'ORDER_UPDATE') {
        console.log('Order update:', lastMessage.data);
        setOrderUpdate((prev) => prev + 1);
      }
    }
  }, [lastMessage, symbol]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT'];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Trading Platform</h1>
          <div className="flex items-center gap-4">
            <Badge variant={connected ? "default" : "destructive"} className="gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {connected ? 'Live' : 'Disconnected'}
            </Badge>
            <Button onClick={handleLogout} variant="destructive" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Left Panel - Order Entry */}
        <div className="lg:col-span-1">
          {/* Symbol Selector */}
          <Card className="bg-gray-800 border-gray-700 p-4 mb-4">
            <label className="block text-gray-300 mb-2 text-sm font-semibold">Trading Pair</label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-full bg-gray-700 text-white border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {symbols.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Order Entry */}
          <OrderEntry 
            symbol={symbol} 
            currentPrice={currentPrice}
            onOrderPlaced={() => setOrderUpdate((p) => p + 1)} 
          />
        </div>

        {/* Right Panel - Chart & Orders */}
        <div className="lg:col-span-2 space-y-4">
          {/* Price Display */}
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm">{symbol}</div>
                <div className="text-white text-3xl font-bold">
                  ${currentPrice.toFixed(2)}
                </div>
              </div>
              <Badge 
                variant={priceChange >= 0 ? "default" : "destructive"}
                className={`text-xl font-semibold px-4 py-2 ${
                  priceChange >= 0 
                    ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' 
                    : 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                }`}
              >
                {priceChange >= 0 ? '+' : ''}
                {priceChange.toFixed(2)}%
              </Badge>
            </div>
          </Card>

          {/* Chart */}
          <TradingChart symbol={symbol} />

          {/* Orders/Positions Table */}
          <OrdersTable onUpdate={orderUpdate} />
        </div>
      </div>
    </div>
  );
}
