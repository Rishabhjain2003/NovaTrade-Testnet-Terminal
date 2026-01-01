'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface TradingChartProps {
  symbol: string;
  onPriceUpdate?: (price: number) => void;
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '1d';

export default function TradingChart({ symbol, onPriceUpdate }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const lastCandleRef = useRef<any>(null);

  useEffect(() => {
    const initChart = async () => {
      if (!chartContainerRef.current) return;

      const LightweightCharts = await import('lightweight-charts');
      
      // Properly remove existing chart
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove();
        } catch (e) {
          console.log('Chart removal error:', e);
        }
        chartInstanceRef.current = null;
      }

      const chart = LightweightCharts.createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 500,
        layout: {
          background: { color: '#1a1a1a' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: '#2b2b43' },
          horzLines: { color: '#2b2b43' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartInstanceRef.current = chart;

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      candleSeriesRef.current = candlestickSeries;

      // Fetch historical data
      try {
        const response = await fetch(
          `https://testnet.binance.vision/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=100`
        );
        const data = await response.json();

        const formattedData = data.map((candle: any) => ({
          time: candle[0] / 1000,
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
        }));

        candlestickSeries.setData(formattedData);
        
        // Store last candle for updates
        if (formattedData.length > 0) {
          lastCandleRef.current = formattedData[formattedData.length - 1];
        }
        
        chart.timeScale().fitContent();
      } catch (error) {
        console.error('Chart data error:', error);
      }

      const handleResize = () => {
        if (chartContainerRef.current && chartInstanceRef.current) {
          chartInstanceRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };

    initChart();

    return () => {
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        chartInstanceRef.current = null;
      }
    };
  }, [symbol, timeframe]);

  // Listen to price updates from parent
  useEffect(() => {
    const handlePriceUpdate = (event: any) => {
      if (!event.detail) return;
      
      const { symbol: updatedSymbol, price } = event.detail;
      
      if (updatedSymbol === symbol && candleSeriesRef.current && lastCandleRef.current) {
        // Update last candle
        const updatedCandle = {
          ...lastCandleRef.current,
          close: price,
          high: Math.max(lastCandleRef.current.high, price),
          low: Math.min(lastCandleRef.current.low, price),
        };
        
        lastCandleRef.current = updatedCandle;
        
        try {
          candleSeriesRef.current.update(updatedCandle);
        } catch (e) {
          console.log('Chart update error:', e);
        }
        
        if (onPriceUpdate) {
          onPriceUpdate(price);
        }
      }
    };

    window.addEventListener('priceUpdate', handlePriceUpdate);
    
    return () => {
      window.removeEventListener('priceUpdate', handlePriceUpdate);
    };
  }, [symbol, onPriceUpdate]);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-white font-semibold text-lg">
          {symbol} Chart
        </CardTitle>
        
        {/* Timeframe Selector */}
        <ToggleGroup 
          type="single" 
          value={timeframe} 
          onValueChange={(value) => value && setTimeframe(value as Timeframe)}
          className="bg-gray-900 rounded p-1"
        >
          {(['1m', '5m', '15m', '1h', '1d'] as Timeframe[]).map((tf) => (
            <ToggleGroupItem
              key={tf}
              value={tf}
              className="data-[state=on]:bg-blue-600 data-[state=on]:text-white text-gray-400 hover:text-white"
              size="sm"
            >
              {tf}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} style={{ position: 'relative', minHeight: '500px' }} />
      </CardContent>
    </Card>
  );
}
