'use client';

import { useState, useEffect } from 'react';
import { tradingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OrderEntryProps {
  symbol: string;
  currentPrice: number;
  onOrderPlaced?: () => void;
}

export default function OrderEntry({ symbol, currentPrice, onOrderPlaced }: OrderEntryProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balance, setBalance] = useState({ usdt: 0, btc: 0 });

  // Calculate total cost
  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const priceValue = orderType === 'MARKET' ? currentPrice : parseFloat(price) || 0;
    return (qty * priceValue).toFixed(2);
  };

  // Fetch balance on mount
  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      // Simulated balance - in production, fetch from backend
      setBalance({
        usdt: 10000,
        btc: 0.5,
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!quantity || parseFloat(quantity) <= 0) {
        throw new Error('Invalid quantity');
      }

      if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
        throw new Error('Invalid price');
      }

      const orderData: any = {
        symbol,
        side,
        type: orderType,
        quantity: parseFloat(quantity),
      };

      if (orderType === 'LIMIT') {
        orderData.price = parseFloat(price);
      }

      await tradingApi.placeOrder(orderData);
      setSuccess(`${side} order placed successfully!`);
      setQuantity('');
      setPrice('');
      
      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Place Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buy/Sell Tabs */}
        <div className="flex gap-2">
          <Button
            onClick={() => setSide('BUY')}
            variant={side === 'BUY' ? 'default' : 'outline'}
            className={`flex-1 ${
              side === 'BUY'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Buy
          </Button>
          <Button
            onClick={() => setSide('SELL')}
            variant={side === 'SELL' ? 'default' : 'outline'}
            className={`flex-1 ${
              side === 'SELL'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Sell
          </Button>
        </div>

        {/* Order Type */}
        <div className="space-y-2">
          <Label className="text-gray-300">Order Type</Label>
          <Select value={orderType} onValueChange={(value) => setOrderType(value as 'MARKET' | 'LIMIT')}>
            <SelectTrigger className="bg-gray-700 text-white border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MARKET">Market</SelectItem>
              <SelectItem value="LIMIT">Limit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price (for limit orders) */}
        {orderType === 'LIMIT' && (
          <div className="space-y-2">
            <Label className="text-gray-300">Price (USDT)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
            />
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-2">
          <Label className="text-gray-300">Quantity (BTC)</Label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.001"
            step="0.001"
            className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
          />
        </div>

        {/* Available Balance */}
        <Card className="bg-gray-700 border-gray-600">
          <CardContent className="p-3">
            <div className="text-gray-400 text-sm mb-1">Available Balance</div>
            <div className="flex justify-between text-white">
              <span>USDT: {balance.usdt.toFixed(2)}</span>
              <span>BTC: {balance.btc.toFixed(4)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card className="bg-gray-700 border-gray-600">
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Total</span>
              <span className="text-white font-semibold text-lg">
                {calculateTotal()} USDT
              </span>
            </div>
            {orderType === 'MARKET' && (
              <div className="text-gray-500 text-xs mt-1">
                Estimated at current market price
              </div>
            )}
          </CardContent>
        </Card>

        {/* Symbol Display */}
        <Card className="bg-gray-700 border-gray-600">
          <CardContent className="p-3">
            <div className="text-gray-400 text-sm">Trading Pair</div>
            <div className="text-white font-semibold">{symbol}</div>
            {currentPrice > 0 && (
              <div className="text-gray-400 text-xs">
                Current Price: ${currentPrice.toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-900/20 border-green-700 text-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Place Order Button */}
        <Button
          onClick={handlePlaceOrder}
          disabled={loading}
          className={`w-full ${
            side === 'BUY'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {loading ? 'Placing Order...' : `${side} ${symbol}`}
        </Button>
      </CardContent>
    </Card>
  );
}
