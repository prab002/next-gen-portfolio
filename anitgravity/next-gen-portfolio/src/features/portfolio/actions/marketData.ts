'use server';

export interface KlineData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export async function getHistoricalData(symbol: string, interval: string = '1d'): Promise<KlineData[]> {
    // Convert symbol format (e.g., "BTC/USD" -> "BTCUSDT")
    const formattedSymbol = symbol.replace('/', '').toUpperCase().replace('USD', 'USDT');

    try {
        const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=500`, 
            { next: { revalidate: 60 } }
        );

        if (!response.ok) {
            console.error('Binance API Error:', response.statusText);
            return [];
        }

        const data = await response.json();

        // Map Binance response [time, open, high, low, close, volume, ...]
        return data.map((d: any) => ({
            time: d[0] / 1000, // Convert ms to seconds for lightweight-charts
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
        }));

    } catch (error) {
        console.error('Failed to fetch historical data:', error);
        return [];
    }
}
