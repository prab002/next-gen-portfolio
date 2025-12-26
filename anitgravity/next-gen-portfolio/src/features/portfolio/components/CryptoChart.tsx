import React, { useRef, useState, useEffect } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries } from 'lightweight-charts';
import styles from '../styles/PortfolioTerminal.module.css';
import { getHistoricalData, KlineData } from '../actions/marketData';

interface CryptoChartProps {
  symbol?: string;
  height?: number;
}

export const CryptoChart: React.FC<CryptoChartProps> = ({ 
  symbol = 'BTC/USD', 
  height = 400 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null); 
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [lastPrice, setLastPrice] = useState<number>(0);
  const [interval, setInterval] = useState<string>('1d');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#888',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
      },
      timeScale: {
        borderColor: '#2B2B43',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#2B2B43',
      },
    });

    chartRef.current = chart;

    // Create Candlestick Series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00E396',
      downColor: '#FF4560',
      borderVisible: false,
      wickUpColor: '#00E396',
      wickDownColor: '#FF4560',
    });
    
    seriesRef.current = candlestickSeries;

    // Initial Data Fetch & Real-time Updates
    let socket: WebSocket | null = null;
    
    const loadData = async () => {
      // 1. Fetch Historical Data
      const historicalData = await getHistoricalData(symbol, interval);
      if (historicalData && historicalData.length > 0) {
        candlestickSeries.setData(historicalData as any);
        const lastCandle = historicalData[historicalData.length - 1];
        setCurrentPrice(lastCandle.close);
        setLastPrice(historicalData[historicalData.length - 2]?.close || lastCandle.open);
      }

      // 2. Connect to WebSocket for Live Updates
      const formattedSymbol = symbol.replace('/', '').toLowerCase().replace('usd', 'usdt');
      socket = new WebSocket(`wss://stream.binance.com:9443/ws/${formattedSymbol}@kline_${interval}`);

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const kline = message.k;
        
        const candle: KlineData = {
          time: kline.t / 1000,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        };

        candlestickSeries.update(candle as any);
        setLastPrice(prev => { 
            return candle.open; 
        });
        setCurrentPrice(candle.close);
      };
    };

    loadData();

    // Responsive Resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      if (socket) socket.close();
    };
  }, [height, symbol, interval]);

  const priceColor = currentPrice >= lastPrice ? '#00E396' : '#FF4560';

  return (
    <div className={styles.chartCard} style={{ background: 'rgba(16, 16, 20, 0.6)', border: '1px solid #333', borderRadius: '12px', padding: '1rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
           <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{symbol}</span>
           <span style={{ color: priceColor, fontSize: '1.2rem', fontWeight: 'bold' }}>
             ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['1h', '4h', '1d'].map((frame) => (
                <button
                    key={frame}
                    onClick={() => setInterval(frame)}
                    style={{
                        background: interval === frame ? '#00E396' : 'rgba(255,255,255,0.1)',
                        color: interval === frame ? '#000' : '#fff',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                    }}
                >
                    {frame.toUpperCase()}
                </button>
            ))}
        </div>
      </div>
      <div style={{ fontSize: '0.8rem', color: '#00E396', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
         <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#00E396', boxShadow: '0 0 4px #00E396' }}></span>
         LIVE BINANCE DATA
      </div>
      <div ref={chartContainerRef} style={{ position: 'relative' }} />
    </div>
  );
};
