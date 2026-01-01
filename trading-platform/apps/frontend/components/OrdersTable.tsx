'use client';

import { useEffect, useState } from 'react';
import { tradingApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Order {
  id: string;
  orderId: string;
  symbol: string;
  side: string;
  quantity: number;
  executedQty?: number;
  price?: number;
  status: string;
  timestamp: string;
}

interface Position {
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export default function OrdersTable({ onUpdate }: { onUpdate?: number }) {
  const [activeTab, setActiveTab] = useState<'orders' | 'positions'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [onUpdate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const data = await tradingApi.getOrders();
        setOrders(data);
      } else {
        const data = await tradingApi.getPositions();
        setPositions(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'orders' | 'positions')}>
          <TabsList className="bg-gray-700 mb-4">
            <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600">
              Orders
            </TabsTrigger>
            <TabsTrigger value="positions" className="data-[state=active]:bg-blue-600">
              Positions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-700/50">
                      <TableHead className="text-gray-400">Symbol</TableHead>
                      <TableHead className="text-gray-400">Side</TableHead>
                      <TableHead className="text-right text-gray-400">Quantity</TableHead>
                      <TableHead className="text-right text-gray-400">Price</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          No orders yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id} className="border-gray-700 hover:bg-gray-700/50">
                          <TableCell className="text-white font-medium">{order.symbol}</TableCell>
                          <TableCell>
                            <Badge
                              variant={order.side === 'BUY' ? 'default' : 'destructive'}
                              className={
                                order.side === 'BUY'
                                  ? 'bg-green-900 text-green-300 hover:bg-green-800'
                                  : 'bg-red-900 text-red-300 hover:bg-red-800'
                              }
                            >
                              {order.side}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-white">
                            {order.executedQty || order.quantity}
                          </TableCell>
                          <TableCell className="text-right text-white">
                            {order.price ? order.price.toFixed(2) : 'Market'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === 'FILLED'
                                  ? 'default'
                                  : order.status === 'REJECTED'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className={
                                order.status === 'FILLED'
                                  ? 'bg-green-900 text-green-300 hover:bg-green-800'
                                  : order.status === 'REJECTED'
                                  ? 'bg-red-900 text-red-300 hover:bg-red-800'
                                  : 'bg-yellow-900 text-yellow-300 hover:bg-yellow-800'
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs">
                            {new Date(order.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="positions">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-700/50">
                      <TableHead className="text-gray-400">Symbol</TableHead>
                      <TableHead className="text-right text-gray-400">Quantity</TableHead>
                      <TableHead className="text-right text-gray-400">Avg Entry</TableHead>
                      <TableHead className="text-right text-gray-400">Unrealized PnL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          No positions
                        </TableCell>
                      </TableRow>
                    ) : (
                      positions.map((position) => (
                        <TableRow key={position.symbol} className="border-gray-700 hover:bg-gray-700/50">
                          <TableCell className="text-white font-medium">{position.symbol}</TableCell>
                          <TableCell className="text-right text-white">
                            {position.quantity.toFixed(4)}
                          </TableCell>
                          <TableCell className="text-right text-white">
                            ${position.avgEntryPrice.toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${
                              position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            ${position.unrealizedPnl.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
