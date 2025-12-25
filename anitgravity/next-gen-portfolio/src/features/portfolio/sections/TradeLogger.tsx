import React, { useState, useEffect, useMemo, useRef } from 'react';
import styles from '../styles/PortfolioTerminal.module.css';
import { parseCSV, calculatePortfolioStats, loadCSVFromFile, PortfolioStats } from '../utils/csvParser';

interface Trade {
    id: string;
    symbol: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice: number;
    amountInvested: number;
    pnl: number;
    pnlPercent: number;
    strategy: string;
    mistakes: string;
    setup: string;
    status: 'WIN' | 'LOSS' | 'BE';
    timestamp: number;
    dateStr: string;
}

type Tab = 'DASHBOARD' | 'JOURNAL' | 'ANALYTICS';

const USD_TO_INR = 85; // Fixed conversion rate

export const TradeLogger = () => {
    const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
    const [initialCapital, setInitialCapital] = useState<number>(10000);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [csvStats, setCsvStats] = useState<PortfolioStats | null>(null);
    const [isCSVMode, setIsCSVMode] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        symbol: '',
        direction: 'LONG',
        entryPrice: '',
        exitPrice: '',
        amountInvested: '',
        strategy: '',
        mistakes: '',
        setup: ''
    });

    useEffect(() => {
        const savedTrades = localStorage.getItem('tradel_log');
        const savedCap = localStorage.getItem('tradel_capital');
        if (savedTrades) setTrades(JSON.parse(savedTrades));
        if (savedCap) setInitialCapital(Number(savedCap));
    }, []);

    useEffect(() => {
        localStorage.setItem('tradel_log', JSON.stringify(trades));
        localStorage.setItem('tradel_capital', initialCapital.toString());
    }, [trades, initialCapital]);

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const csvText = await loadCSVFromFile(file);
            const transactions = parseCSV(csvText);
            const stats = calculatePortfolioStats(transactions);
            setCsvStats(stats);
            setIsCSVMode(true);
        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Failed to parse CSV file. Please check the format.');
        }
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleAddTrade = (e: React.FormEvent) => {
        e.preventDefault();
        const entry = parseFloat(formData.entryPrice);
        const exit = parseFloat(formData.exitPrice);
        const amount = parseFloat(formData.amountInvested);
        
        if (!entry || !exit || !amount) return;

        let pnlPercent = 0;
        if (formData.direction === 'LONG') {
            pnlPercent = ((exit - entry) / entry) * 100;
        } else {
            pnlPercent = ((entry - exit) / entry) * 100;
        }

        const pnl = (amount * pnlPercent) / 100;
        const status = pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'BE';

        const newTrade: Trade = {
            id: Date.now().toString(),
            symbol: formData.symbol.toUpperCase() || 'UNKNOWN',
            direction: formData.direction as 'LONG' | 'SHORT',
            entryPrice: entry,
            exitPrice: exit,
            amountInvested: amount,
            pnl,
            pnlPercent,
            strategy: formData.strategy,
            mistakes: formData.mistakes,
            setup: formData.setup,
            status,
            timestamp: Date.now(),
            dateStr: new Date().toISOString().split('T')[0]
        };

        setTrades(prev => [newTrade, ...prev]);
        setFormData({ symbol: '', direction: 'LONG', entryPrice: '', exitPrice: '', amountInvested: '', strategy: '', mistakes: '', setup: '' });
        setIsFormOpen(false);
    };

    const analytics = useMemo(() => {
        // Use CSV stats if in CSV mode
        if (isCSVMode && csvStats) {
            const wins = csvStats.trades.filter(t => t.type === 'profit');
            const losses = csvStats.trades.filter(t => t.type === 'loss');

            const grossProfit = wins.reduce((acc, t) => acc + t.amount, 0);
            const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.amount, 0));

            const winRate = csvStats.trades.length > 0 ? ((wins.length / csvStats.trades.length) * 100).toFixed(1) : '0.0';
            const profitFactor = grossLoss === 0 ? grossProfit.toFixed(2) : (grossProfit / grossLoss).toFixed(2);

            // Build equity curve from transactions
            const equityPoints = [{ x: 0, y: csvStats.totalDeposits }];
            let runningBal = csvStats.totalDeposits;
            const sortedTransactions = [...csvStats.transactions].sort((a, b) => a.timestamp - b.timestamp);

            sortedTransactions.forEach((tx, i) => {
                if (tx.transactionType === 'cashflow' || tx.transactionType === 'funding' ||
                    tx.transactionType === 'trading fees' || tx.transactionType === 'liquidation_fee') {
                    runningBal += tx.amountWithGst;
                    equityPoints.push({ x: i + 1, y: runningBal });
                }
            });

            // Calculate day-wise returns for CSV mode
            const dailyReturnsMap = new Map<string, { date: string, pnl: number, pnlPercent: number }>();

            csvStats.transactions.forEach(tx => {
                const dateStr = tx.date.split(' ')[0]; // Get YYYY-MM-DD

                if (!dailyReturnsMap.has(dateStr)) {
                    dailyReturnsMap.set(dateStr, { date: dateStr, pnl: 0, pnlPercent: 0 });
                }

                const day = dailyReturnsMap.get(dateStr)!;

                // Sum all P&L affecting transactions for the day
                if (tx.transactionType === 'cashflow' || tx.transactionType === 'funding' ||
                    tx.transactionType === 'trading fees' || tx.transactionType === 'liquidation_fee') {
                    day.pnl += tx.amountWithGst;
                }
            });

            // Convert to array and calculate percentages
            const dailyReturns = Array.from(dailyReturnsMap.values())
                .map(day => ({
                    ...day,
                    pnlPercent: csvStats.totalDeposits > 0 ? (day.pnl / csvStats.totalDeposits) * 100 : 0
                }))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 30); // Show last 30 trading days

            // === NEW FEATURE 1: RISK MANAGEMENT METRICS ===
            // Calculate Max Drawdown
            let maxDrawdown = 0;
            let peak = equityPoints[0]?.y || 0;
            const drawdownPoints: { x: number; y: number }[] = [];

            equityPoints.forEach((point, i) => {
                if (point.y > peak) peak = point.y;
                const drawdown = peak > 0 ? ((peak - point.y) / peak) * 100 : 0;
                drawdownPoints.push({ x: i, y: -drawdown });
                if (drawdown > maxDrawdown) maxDrawdown = drawdown;
            });

            // Calculate Sharpe Ratio (assuming risk-free rate = 0)
            const allDailyReturns = Array.from(dailyReturnsMap.values());
            const avgDailyReturn = allDailyReturns.reduce((sum, d) => sum + d.pnlPercent, 0) / (allDailyReturns.length || 1);
            const variance = allDailyReturns.reduce((sum, d) => sum + Math.pow(d.pnlPercent - avgDailyReturn, 2), 0) / (allDailyReturns.length || 1);
            const stdDev = Math.sqrt(variance);
            const sharpeRatio = stdDev > 0 ? (avgDailyReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

            // Calculate Consecutive Streaks
            let currentStreak = 0;
            let maxWinStreak = 0;
            let maxLossStreak = 0;
            const sortedTrades = [...csvStats.trades].sort((a, b) => a.timestamp - b.timestamp);

            sortedTrades.forEach(trade => {
                if (trade.type === 'profit') {
                    currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
                    if (currentStreak > maxWinStreak) maxWinStreak = currentStreak;
                } else {
                    currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
                    if (Math.abs(currentStreak) > maxLossStreak) maxLossStreak = Math.abs(currentStreak);
                }
            });

            // === NEW FEATURE 2: SYMBOL PERFORMANCE ===
            const symbolPerformance = new Map<string, { pnl: number; trades: number; wins: number }>();
            csvStats.trades.forEach(trade => {
                const symbol = trade.symbol.replace('USD', '');
                if (!symbolPerformance.has(symbol)) {
                    symbolPerformance.set(symbol, { pnl: 0, trades: 0, wins: 0 });
                }
                const perf = symbolPerformance.get(symbol)!;
                perf.pnl += trade.amount;
                perf.trades++;
                if (trade.type === 'profit') perf.wins++;
            });

            const symbolStats = Array.from(symbolPerformance.entries())
                .map(([symbol, stats]) => ({
                    symbol,
                    pnl: stats.pnl,
                    trades: stats.trades,
                    winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0
                }))
                .sort((a, b) => b.pnl - a.pnl);

            // === NEW FEATURE 3: BEST/WORST DAYS ===
            const bestDays = [...allDailyReturns].sort((a, b) => b.pnl - a.pnl).slice(0, 5);
            const worstDays = [...allDailyReturns].sort((a, b) => a.pnl - b.pnl).slice(0, 5);

            // === NEW ANALYTICS FEATURES ===
            // Day of Week Performance
            const dayOfWeekStats = new Map<number, { pnl: number; trades: number; wins: number }>();
            for (let i = 0; i < 7; i++) {
                dayOfWeekStats.set(i, { pnl: 0, trades: 0, wins: 0 });
            }

            if (csvStats.trades && csvStats.trades.length > 0) {
                csvStats.trades.forEach(trade => {
                    if (trade && trade.timestamp !== undefined) {
                        const dayOfWeek = new Date(trade.timestamp).getDay();
                        const stats = dayOfWeekStats.get(dayOfWeek);
                        if (stats) {
                            stats.pnl += trade.amount || 0;
                            stats.trades++;
                            if (trade.type === 'profit') stats.wins++;
                        }
                    }
                });
            }

            const dayOfWeekPerformance = Array.from(dayOfWeekStats.entries()).map(([day, stats]) => ({
                day,
                dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
                pnl: stats.pnl,
                trades: stats.trades,
                winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0
            }));

            // Hourly Performance
            const hourlyStats = new Map<number, { pnl: number; trades: number }>();
            for (let i = 0; i < 24; i++) {
                hourlyStats.set(i, { pnl: 0, trades: 0 });
            }

            if (csvStats.transactions && csvStats.transactions.length > 0) {
                csvStats.transactions.forEach(tx => {
                    if (tx && tx.transactionType === 'cashflow' && tx.timestamp !== undefined) {
                        const hour = new Date(tx.timestamp).getHours();
                        const stats = hourlyStats.get(hour);
                        if (stats) {
                            stats.pnl += tx.amountWithGst || 0;
                            stats.trades++;
                        }
                    }
                });
            }

            const hourlyPerformance = Array.from(hourlyStats.entries()).map(([hour, stats]) => ({
                hour,
                pnl: stats.pnl,
                trades: stats.trades
            })).filter(h => h.trades > 0);

            // Win/Loss Streak Timeline
            const streakTimeline: { date: string; streak: number; type: 'win' | 'loss' }[] = [];
            let currentStreak2 = 0;
            let currentType: 'win' | 'loss' | null = null;

            if (csvStats.trades && csvStats.trades.length > 0) {
                [...csvStats.trades].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)).forEach(trade => {
                    if (trade && trade.type && trade.dateStr) {
                        if (trade.type === 'profit') {
                            if (currentType === 'win') {
                                currentStreak2++;
                            } else {
                                currentStreak2 = 1;
                                currentType = 'win';
                            }
                        } else {
                            if (currentType === 'loss') {
                                currentStreak2++;
                            } else {
                                currentStreak2 = 1;
                                currentType = 'loss';
                            }
                        }
                        streakTimeline.push({
                            date: trade.dateStr,
                            streak: currentType === 'win' ? currentStreak2 : -currentStreak2,
                            type: currentType as 'win' | 'loss'
                        });
                    }
                });
            }

            // Profit Distribution (histogram buckets)
            const profitBuckets = new Map<string, number>();
            const bucketSize = 0.5; // $0.5 buckets

            if (csvStats.trades && csvStats.trades.length > 0) {
                csvStats.trades.forEach(trade => {
                    if (trade && trade.amount !== undefined) {
                        const bucket = Math.floor(trade.amount / bucketSize) * bucketSize;
                        const key = bucket.toFixed(1);
                        profitBuckets.set(key, (profitBuckets.get(key) || 0) + 1);
                    }
                });
            }

            const profitDistribution = Array.from(profitBuckets.entries())
                .map(([bucket, count]) => ({ bucket: parseFloat(bucket), count }))
                .sort((a, b) => a.bucket - b.bucket);

            // Calendar Heatmap Data (last 90 days)
            const today = new Date();
            const calendarData: { date: string; pnl: number; trades: number }[] = [];
            const dailyPnlMap = new Map(allDailyReturns && allDailyReturns.length > 0
                ? allDailyReturns.filter(d => d && d.date && d.pnl !== undefined).map(d => [d.date, d.pnl])
                : []);

            for (let i = 89; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const pnl = dailyPnlMap.get(dateStr) || 0;
                const dayTrades = csvStats.trades && csvStats.trades.length > 0
                    ? csvStats.trades.filter(t => t && t.dateStr === dateStr).length
                    : 0;

                calendarData.push({ date: dateStr, pnl, trades: dayTrades });
            }

            // === NEW FEATURE 5: ADVANCED TRADE STATISTICS ===
            const winningTrades = wins.map(t => t.amount);
            const losingTrades = losses.map(t => Math.abs(t.amount));

            const avgWin = winningTrades.length > 0 ? winningTrades.reduce((a, b) => a + b, 0) / winningTrades.length : 0;
            const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((a, b) => a + b, 0) / losingTrades.length : 0;
            const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades) : 0;
            const largestLoss = losingTrades.length > 0 ? Math.max(...losingTrades) : 0;
            const expectancy = csvStats.trades.length > 0
                ? ((wins.length / csvStats.trades.length) * avgWin) - ((losses.length / csvStats.trades.length) * avgLoss)
                : 0;

            return {
                totalPnl: csvStats.totalPnL,
                winRate,
                profitFactor,
                currentBalance: csvStats.currentBalance,
                equityPoints,
                monthlyReturns: [], // Keep for compatibility
                dailyReturns,
                totalTrades: csvStats.trades.length,
                totalFees: csvStats.totalFees,
                totalLiquidationFees: csvStats.totalLiquidationFees,
                totalFunding: csvStats.totalFunding,
                // New metrics
                maxDrawdown,
                sharpeRatio,
                maxWinStreak,
                maxLossStreak,
                symbolStats,
                bestDays,
                worstDays,
                drawdownPoints,
                avgWin,
                avgLoss,
                largestWin,
                largestLoss,
                expectancy,
                // New analytics
                dayOfWeekPerformance,
                hourlyPerformance,
                streakTimeline,
                profitDistribution,
                calendarData
            };
        }

        // Original manual trade analytics
        const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
        const wins = trades.filter(t => t.pnl > 0);
        const losses = trades.filter(t => t.pnl < 0);

        const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));

        const winRate = trades.length > 0 ? ((wins.length / trades.length) * 100).toFixed(1) : '0.0';
        const profitFactor = grossLoss === 0 ? grossProfit.toFixed(2) : (grossProfit / grossLoss).toFixed(2);

        const currentBalance = initialCapital + totalPnl;

        let runningBal = initialCapital;
        const equityPoints = [{ x: 0, y: initialCapital }];
        [...trades].sort((a,b) => a.timestamp - b.timestamp).forEach((t, i) => {
            runningBal += t.pnl;
            equityPoints.push({ x: i + 1, y: runningBal });
        });

        const currentYear = new Date().getFullYear();
        const monthlyReturns = Array(12).fill(0);
        trades.forEach(t => {
            const date = new Date(t.timestamp);
            if (date.getFullYear() === currentYear) {
                monthlyReturns[date.getMonth()] += t.pnlPercent;
            }
        });

        // Calculate day-wise returns for manual trades
        const dailyReturnsMap = new Map<string, { date: string, pnl: number, pnlPercent: number }>();

        trades.forEach(t => {
            if (!dailyReturnsMap.has(t.dateStr)) {
                dailyReturnsMap.set(t.dateStr, { date: t.dateStr, pnl: 0, pnlPercent: 0 });
            }
            const day = dailyReturnsMap.get(t.dateStr)!;
            day.pnl += t.pnl;
            day.pnlPercent += t.pnlPercent;
        });

        const dailyReturns = Array.from(dailyReturnsMap.values())
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 30);

        return {
            totalPnl,
            winRate,
            profitFactor,
            currentBalance,
            equityPoints,
            monthlyReturns,
            dailyReturns,
            totalTrades: trades.length,
            totalFees: 0,
            totalLiquidationFees: 0,
            totalFunding: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            maxWinStreak: 0,
            maxLossStreak: 0,
            symbolStats: [],
            bestDays: [],
            worstDays: [],
            drawdownPoints: [],
            avgWin: 0,
            avgLoss: 0,
            largestWin: 0,
            largestLoss: 0,
            expectancy: 0,
            dayOfWeekPerformance: [],
            hourlyPerformance: [],
            streakTimeline: [],
            profitDistribution: [],
            calendarData: []
        };
    }, [trades, initialCapital, isCSVMode, csvStats]);

    const formatCurrency = (usdAmount: number, showBothCurrencies = true) => {
        const inrAmount = usdAmount * USD_TO_INR;
        if (showBothCurrencies) {
            return (
                <>
                    ${usdAmount.toFixed(2)}
                    <span style={{ fontSize: '0.7em', color: '#888', marginLeft: '0.25rem' }}>
                        (₹{inrAmount.toFixed(2)})
                    </span>
                </>
            );
        }
        return `$${usdAmount.toFixed(2)}`;
    };

    const renderChart = () => {
        if (analytics.equityPoints.length < 2) return <div className={styles.emptyChart}>NO DATA AVAILABLE</div>;
        const points = analytics.equityPoints;
        const width = 1000;
        const height = 300;
        const minVal = Math.min(...points.map(p => p.y));
        const maxVal = Math.max(...points.map(p => p.y));
        const range = maxVal - minVal || 100;

        const pathData = points.map((p, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - ((p.y - (minVal * 0.99)) / (range * 1.1)) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                   <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#4776E6" stopOpacity="0.2"/>
                       <stop offset="100%" stopColor="#4776E6" stopOpacity="0"/>
                   </linearGradient>
                </defs>
                <path d={`M0,${height} ${pathData} L${width},${height} Z`} fill="url(#chartFill)" />
                <polyline points={pathData} fill="none" stroke="#4776E6" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </svg>
        );
    };

    return (
        <div ref={containerRef} className={styles.tradelApp} style={isFullscreen ? { background: '#0a0a0a' } : {}}>
            {/* SIDEBAR */}
            <div className={styles.tradelSidebar}>
                <div className={styles.sidebarLogo}>TRADEL<span>PRO</span></div>
                <div className={styles.navMenu}>
                    <div className={`${styles.navItem} ${activeTab === 'DASHBOARD' ? styles.navActive : ''}`} onClick={() => setActiveTab('DASHBOARD')}>
                        DASHBOARD
                    </div>
                    <div className={`${styles.navItem} ${activeTab === 'JOURNAL' ? styles.navActive : ''}`} onClick={() => setActiveTab('JOURNAL')}>
                        JOURNAL
                    </div>
                    <div className={`${styles.navItem} ${activeTab === 'ANALYTICS' ? styles.navActive : ''}`} onClick={() => setActiveTab('ANALYTICS')}>
                        ANALYTICS
                    </div>
                </div>
                <div className={styles.sidebarFooter}>
                    <div className={styles.accountStatus}>
                        <span>BALANCE</span>
                        <strong style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                            <span>${analytics.currentBalance.toFixed(2)}</span>
                            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 'normal' }}>
                                ₹{(analytics.currentBalance * USD_TO_INR).toFixed(2)}
                            </span>
                        </strong>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className={styles.tradelContent}>
                {/* TOP BAR */}
                <div className={styles.topBar}>
                    <div className={styles.pageTitle}>
                        {activeTab}
                        {isCSVMode && <span style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#00E396' }}>● CSV MODE</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleCSVUpload}
                            style={{ display: 'none' }}
                        />
                        <button
                            className={styles.addTradeBtn}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ background: isCSVMode ? '#00E396' : undefined }}
                        >
                            {isCSVMode ? '✓ CSV LOADED' : '📊 LOAD CSV'}
                        </button>
                        {isCSVMode && (
                            <button
                                className={styles.addTradeBtn}
                                onClick={() => { setIsCSVMode(false); setCsvStats(null); }}
                                style={{ background: '#FF4560' }}
                            >
                                CLEAR CSV
                            </button>
                        )}
                        {!isCSVMode && (
                            <button className={styles.addTradeBtn} onClick={() => setIsFormOpen(true)}>+ NEW TRADE</button>
                        )}
                        <button
                            className={styles.addTradeBtn}
                            onClick={toggleFullscreen}
                            style={{ background: isFullscreen ? '#4776E6' : '#333', marginLeft: '0.5rem' }}
                            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        >
                            {isFullscreen ? '⛶ EXIT' : '⛶ FULLSCREEN'}
                        </button>
                    </div>
                </div>

                {/* DASHBOARD VIEW */}
                {activeTab === 'DASHBOARD' && (
                    <div className={styles.dashboardGrid}>
                        {/* KPI STRIP */}
                        <div className={styles.kpiStrip}>
                            <div className={styles.proKpi}>
                                <div className={styles.proLabel}>NET P&L</div>
                                <div className={`${styles.proValue} ${analytics.totalPnl >= 0 ? styles.textGreen : styles.textRed}`}>
                                    {formatCurrency(analytics.totalPnl)}
                                </div>
                            </div>
                            <div className={styles.proKpi}>
                                <div className={styles.proLabel}>CURRENT BALANCE</div>
                                <div className={styles.proValue}>{formatCurrency(analytics.currentBalance)}</div>
                            </div>
                            <div className={styles.proKpi}>
                                <div className={styles.proLabel}>WIN RATE</div>
                                <div className={styles.proValue}>{analytics.winRate}%</div>
                            </div>
                            <div className={styles.proKpi}>
                                <div className={styles.proLabel}>PROFIT FACTOR</div>
                                <div className={styles.proValue}>{analytics.profitFactor}</div>
                            </div>
                            <div className={styles.proKpi}>
                                <div className={styles.proLabel}>TOTAL TRADES</div>
                                <div className={styles.proValue}>{analytics.totalTrades}</div>
                            </div>
                            {isCSVMode && (
                                <>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>TOTAL FEES</div>
                                        <div className={`${styles.proValue} ${styles.textRed}`}>
                                            -{formatCurrency(analytics.totalFees)}
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>LIQUIDATION FEES</div>
                                        <div className={`${styles.proValue} ${styles.textRed}`}>
                                            -{formatCurrency(analytics.totalLiquidationFees)}
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>FUNDING</div>
                                        <div className={`${styles.proValue} ${analytics.totalFunding >= 0 ? styles.textGreen : styles.textRed}`}>
                                            {formatCurrency(analytics.totalFunding)}
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>MAX DRAWDOWN</div>
                                        <div className={`${styles.proValue} ${styles.textRed}`}>
                                            -{analytics.maxDrawdown.toFixed(2)}%
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>SHARPE RATIO</div>
                                        <div className={`${styles.proValue} ${analytics.sharpeRatio >= 1 ? styles.textGreen : ''}`}>
                                            {analytics.sharpeRatio.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>WIN STREAK</div>
                                        <div className={`${styles.proValue} ${styles.textGreen}`}>
                                            {analytics.maxWinStreak}
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>LOSS STREAK</div>
                                        <div className={`${styles.proValue} ${styles.textRed}`}>
                                            {analytics.maxLossStreak}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* CHARTS ROW */}
                        <div className={styles.chartsRow}>
                            <div className={styles.mainChartCard}>
                                <div className={styles.cardHeader}>EQUITY CURVE</div>
                                <div className={styles.chartWrapper}>
                                    {renderChart()}
                                </div>
                            </div>
                            <div className={styles.heatmapCard}>
                                <div className={styles.cardHeader}>DAILY RETURNS (Last 30 Days)</div>
                                <div className={styles.heatmapGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                                    {analytics.dailyReturns && analytics.dailyReturns.length > 0 ? (
                                        analytics.dailyReturns.map((day) => {
                                            const dateObj = new Date(day.date);
                                            const dayLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                            return (
                                                <div key={day.date} className={styles.heatCell} style={{
                                                    opacity: day.pnl === 0 ? 0.3 : 1,
                                                    color: day.pnl > 0 ? '#00E396' : day.pnl < 0 ? '#FF4560' : '#888',
                                                    background: day.pnl > 0 ? 'rgba(0, 227, 150, 0.1)' : day.pnl < 0 ? 'rgba(255, 69, 96, 0.1)' : 'transparent',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${day.pnl > 0 ? 'rgba(0, 227, 150, 0.3)' : day.pnl < 0 ? 'rgba(255, 69, 96, 0.3)' : '#333'}`
                                                }}>
                                                    <span className={styles.mName} style={{ fontSize: '0.75rem' }}>{dayLabel}</span>
                                                    <span className={styles.mVal} style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                        {day.pnl > 0 ? '+' : ''}${day.pnl.toFixed(2)}
                                                    </span>
                                                    <span style={{ fontSize: '0.65rem', color: '#666', display: 'block' }}>
                                                        ₹{(day.pnl * USD_TO_INR).toFixed(2)}
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', color: '#888', display: 'block', marginTop: '0.15rem' }}>
                                                        {day.pnlPercent > 0 ? '+' : ''}{day.pnlPercent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666', padding: '2rem' }}>
                                            No trading data available
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* NEW FEATURES SECTION - Only show in CSV mode */}
                        {isCSVMode && (
                            <>
                                {/* FEATURE 4: DRAWDOWN CURVE */}
                                <div className={styles.mainChartCard} style={{ marginTop: '1rem' }}>
                                    <div className={styles.cardHeader}>DRAWDOWN CURVE</div>
                                    <div className={styles.chartWrapper}>
                                        {analytics.drawdownPoints.length > 1 ? (
                                            <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="drawdownFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#FF4560" stopOpacity="0"/>
                                                        <stop offset="100%" stopColor="#FF4560" stopOpacity="0.3"/>
                                                    </linearGradient>
                                                </defs>
                                                <path
                                                    d={`M0,0 ${analytics.drawdownPoints.map((p, i) => {
                                                        const x = (i / (analytics.drawdownPoints.length - 1)) * 1000;
                                                        const y = Math.abs(p.y) * 3; // Scale for visibility
                                                        return `${x},${y}`;
                                                    }).join(' ')} L1000,0 Z`}
                                                    fill="url(#drawdownFill)"
                                                />
                                                <polyline
                                                    points={analytics.drawdownPoints.map((p, i) => {
                                                        const x = (i / (analytics.drawdownPoints.length - 1)) * 1000;
                                                        const y = Math.abs(p.y) * 3;
                                                        return `${x},${y}`;
                                                    }).join(' ')}
                                                    fill="none"
                                                    stroke="#FF4560"
                                                    strokeWidth="2"
                                                    vectorEffect="non-scaling-stroke"
                                                />
                                            </svg>
                                        ) : (
                                            <div className={styles.emptyChart}>NO DRAWDOWN DATA</div>
                                        )}
                                    </div>
                                </div>

                                {/* ROW: SYMBOL PERFORMANCE & BEST/WORST DAYS */}
                                <div className={styles.chartsRow} style={{ marginTop: '1rem' }}>
                                    {/* FEATURE 2: SYMBOL PERFORMANCE */}
                                    <div className={styles.heatmapCard}>
                                        <div className={styles.cardHeader}>SYMBOL PERFORMANCE</div>
                                        <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                                            {analytics.symbolStats.slice(0, 10).map(stat => (
                                                <div key={stat.symbol} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.75rem',
                                                    marginBottom: '0.5rem',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${stat.pnl >= 0 ? 'rgba(0, 227, 150, 0.3)' : 'rgba(255, 69, 96, 0.3)'}`
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{stat.symbol}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                            {stat.trades} trades • {stat.winRate.toFixed(0)}% WR
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        fontSize: '1.1rem',
                                                        fontWeight: 'bold',
                                                        color: stat.pnl >= 0 ? '#00E396' : '#FF4560',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-end'
                                                    }}>
                                                        <span>{stat.pnl >= 0 ? '+' : ''}${stat.pnl.toFixed(2)}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#888' }}>
                                                            ₹{(stat.pnl * USD_TO_INR).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* FEATURE 3: BEST/WORST DAYS */}
                                    <div className={styles.heatmapCard}>
                                        <div className={styles.cardHeader}>BEST & WORST DAYS</div>
                                        <div style={{ padding: '1rem' }}>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#00E396', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                                    🏆 TOP 5 WINNING DAYS
                                                </div>
                                                {analytics.bestDays.map(day => (
                                                    <div key={day.date} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        padding: '0.5rem',
                                                        marginBottom: '0.25rem',
                                                        background: 'rgba(0, 227, 150, 0.05)',
                                                        borderRadius: '4px'
                                                    }}>
                                                        <span style={{ fontSize: '0.85rem' }}>{new Date(day.date).toLocaleDateString()}</span>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                            <span style={{ color: '#00E396', fontWeight: 'bold' }}>+${day.pnl.toFixed(2)}</span>
                                                            <span style={{ fontSize: '0.7rem', color: '#888' }}>₹{(day.pnl * USD_TO_INR).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#FF4560', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                                    ⚠️ TOP 5 LOSING DAYS
                                                </div>
                                                {analytics.worstDays.map(day => (
                                                    <div key={day.date} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        padding: '0.5rem',
                                                        marginBottom: '0.25rem',
                                                        background: 'rgba(255, 69, 96, 0.05)',
                                                        borderRadius: '4px'
                                                    }}>
                                                        <span style={{ fontSize: '0.85rem' }}>{new Date(day.date).toLocaleDateString()}</span>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                            <span style={{ color: '#FF4560', fontWeight: 'bold' }}>${day.pnl.toFixed(2)}</span>
                                                            <span style={{ fontSize: '0.7rem', color: '#888' }}>₹{(day.pnl * USD_TO_INR).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FEATURE 5: ADVANCED STATISTICS */}
                                <div className={styles.kpiStrip} style={{ marginTop: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>AVG WIN</div>
                                        <div className={`${styles.proValue} ${styles.textGreen}`}>
                                            {formatCurrency(analytics.avgWin)}
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>AVG LOSS</div>
                                        <div className={`${styles.proValue} ${styles.textRed}`}>
                                            {formatCurrency(analytics.avgLoss)}
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>LARGEST WIN</div>
                                        <div className={`${styles.proValue} ${styles.textGreen}`}>
                                            {formatCurrency(analytics.largestWin)}
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>LARGEST LOSS</div>
                                        <div className={`${styles.proValue} ${styles.textRed}`}>
                                            {formatCurrency(analytics.largestLoss)}
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>EXPECTANCY</div>
                                        <div className={`${styles.proValue} ${analytics.expectancy >= 0 ? styles.textGreen : styles.textRed}`}>
                                            {formatCurrency(analytics.expectancy)}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ANALYTICS VIEW */}
                {activeTab === 'ANALYTICS' && isCSVMode && (
                    <div className={styles.dashboardGrid} style={{ marginTop: '1rem' }}>
                        {/* CALENDAR HEATMAP */}
                        <div className={styles.mainChartCard} style={{ gridColumn: '1/-1' }}>
                            <div className={styles.cardHeader}>📅 CALENDAR HEATMAP - Last 90 Days P&L</div>
                            <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(13, 1fr)',
                                    gap: '4px',
                                    minWidth: '800px'
                                }}>
                                    {analytics.calendarData.map((day) => {
                                        const intensity = Math.abs(day.pnl);
                                        const maxIntensity = Math.max(...analytics.calendarData.map(d => Math.abs(d.pnl)));
                                        const opacity = intensity > 0 ? 0.3 + (intensity / maxIntensity) * 0.7 : 0.1;
                                        const color = day.pnl > 0 ? '#00E396' : day.pnl < 0 ? '#FF4560' : '#333';

                                        return (
                                            <div
                                                key={day.date}
                                                title={`${day.date}\nP&L: $${day.pnl.toFixed(2)} (₹${(day.pnl * USD_TO_INR).toFixed(2)})\nTrades: ${day.trades}`}
                                                style={{
                                                    aspectRatio: '1',
                                                    background: color,
                                                    opacity,
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    border: day.trades > 0 ? '1px solid rgba(255,255,255,0.2)' : '1px solid #222'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.3)';
                                                    e.currentTarget.style.zIndex = '10';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.zIndex = '1';
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.8rem' }}>
                                    <span>Less</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {[0.2, 0.4, 0.6, 0.8, 1.0].map((o, i) => (
                                            <div key={i} style={{ width: '20px', height: '20px', background: '#FF4560', opacity: o, borderRadius: '3px' }} />
                                        ))}
                                    </div>
                                    <span style={{ color: '#FF4560' }}>More Loss</span>
                                    <div style={{ display: 'flex', gap: '4px', marginLeft: '1rem' }}>
                                        {[0.2, 0.4, 0.6, 0.8, 1.0].map((o, i) => (
                                            <div key={i} style={{ width: '20px', height: '20px', background: '#00E396', opacity: o, borderRadius: '3px' }} />
                                        ))}
                                    </div>
                                    <span style={{ color: '#00E396' }}>More Profit</span>
                                </div>
                            </div>
                        </div>

                        {/* DAY OF WEEK & HOURLY PERFORMANCE */}
                        <div className={styles.chartsRow} style={{ marginTop: '1rem' }}>
                            {/* DAY OF WEEK PERFORMANCE */}
                            <div className={styles.mainChartCard}>
                                <div className={styles.cardHeader}>📊 DAY OF WEEK PERFORMANCE</div>
                                <div style={{ padding: '1.5rem' }}>
                                    {analytics.dayOfWeekPerformance.map((day) => {
                                        const maxPnl = Math.max(...analytics.dayOfWeekPerformance.map(d => Math.abs(d.pnl)));
                                        const barWidth = Math.abs(day.pnl) / maxPnl * 100;

                                        return (
                                            <div key={day.day} style={{ marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{day.dayName}</span>
                                                    <span style={{ color: day.pnl >= 0 ? '#00E396' : '#FF4560' }}>
                                                        ${day.pnl.toFixed(2)} • {day.winRate.toFixed(0)}% WR
                                                    </span>
                                                </div>
                                                <div style={{ background: '#222', height: '24px', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                                    <div style={{
                                                        width: `${barWidth}%`,
                                                        height: '100%',
                                                        background: day.pnl >= 0 ? '#00E396' : '#FF4560',
                                                        transition: 'width 0.3s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        paddingLeft: '0.5rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {day.trades} trades
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* HOURLY PERFORMANCE */}
                            <div className={styles.mainChartCard}>
                                <div className={styles.cardHeader}>🕐 HOURLY PERFORMANCE</div>
                                <div style={{ padding: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                                    {analytics.hourlyPerformance.sort((a, b) => b.pnl - a.pnl).slice(0, 10).map((hour) => (
                                        <div key={hour.hour} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem',
                                            marginBottom: '0.5rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '8px',
                                            border: `1px solid ${hour.pnl >= 0 ? 'rgba(0, 227, 150, 0.3)' : 'rgba(255, 69, 96, 0.3)'}`
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{hour.hour}:00 - {hour.hour + 1}:00</div>
                                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{hour.trades} trades</div>
                                            </div>
                                            <div style={{ fontWeight: 'bold', color: hour.pnl >= 0 ? '#00E396' : '#FF4560' }}>
                                                {hour.pnl >= 0 ? '+' : ''}${hour.pnl.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* STREAK VISUALIZER & PROFIT DISTRIBUTION */}
                        <div className={styles.chartsRow} style={{ marginTop: '1rem' }}>
                            {/* WIN/LOSS STREAK TIMELINE */}
                            <div className={styles.mainChartCard}>
                                <div className={styles.cardHeader}>📈 WIN/LOSS STREAK TIMELINE</div>
                                <div style={{ padding: '1.5rem', height: '300px', overflowX: 'auto' }}>
                                    <svg width={analytics.streakTimeline.length * 20} height="250" style={{ minWidth: '100%' }}>
                                        <line x1="0" y1="125" x2={analytics.streakTimeline.length * 20} y2="125" stroke="#444" strokeWidth="1" />
                                        {analytics.streakTimeline.map((item, i) => {
                                            const x = i * 20 + 10;
                                            const height = Math.abs(item.streak) * 20;
                                            const y = item.streak > 0 ? 125 - height : 125;

                                            return (
                                                <g key={i}>
                                                    <rect
                                                        x={x - 8}
                                                        y={y}
                                                        width="16"
                                                        height={height}
                                                        fill={item.type === 'win' ? '#00E396' : '#FF4560'}
                                                        opacity="0.7"
                                                    />
                                                    <title>{`${item.date}\nStreak: ${Math.abs(item.streak)} ${item.type === 'win' ? 'wins' : 'losses'}`}</title>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>
                            </div>

                            {/* PROFIT DISTRIBUTION */}
                            <div className={styles.mainChartCard}>
                                <div className={styles.cardHeader}>📊 PROFIT DISTRIBUTION</div>
                                <div style={{ padding: '1.5rem', height: '300px', overflowX: 'auto' }}>
                                    <svg width={analytics.profitDistribution.length * 30} height="250" style={{ minWidth: '100%' }}>
                                        {analytics.profitDistribution.map((item, i) => {
                                            const maxCount = Math.max(...analytics.profitDistribution.map(d => d.count));
                                            const barHeight = (item.count / maxCount) * 200;
                                            const x = i * 30;
                                            const y = 230 - barHeight;

                                            return (
                                                <g key={i}>
                                                    <rect
                                                        x={x + 5}
                                                        y={y}
                                                        width="20"
                                                        height={barHeight}
                                                        fill={item.bucket >= 0 ? '#00E396' : '#FF4560'}
                                                        opacity="0.8"
                                                    />
                                                    <text x={x + 15} y="245" fontSize="10" fill="#888" textAnchor="middle">
                                                        ${item.bucket.toFixed(1)}
                                                    </text>
                                                    <title>{`P&L: $${item.bucket.toFixed(2)}\nTrades: ${item.count}`}</title>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ANALYTICS' && !isCSVMode && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Analytics Data Available</div>
                        <div>Please load a CSV file to view advanced analytics</div>
                    </div>
                )}

                {/* JOURNAL VIEW */}
                {(activeTab === 'JOURNAL' || activeTab === 'DASHBOARD') && (
                     <div className={styles.recentTradesCard} style={activeTab === 'JOURNAL' ? {flex:1} : {}}>
                        <div className={styles.cardHeader}>RECENT ACTIVITY</div>
                        <div className={styles.proTable}>
                            <div className={styles.ptHeader}>
                                <span>DATE</span>
                                <span>SYMBOL</span>
                                <span>{isCSVMode ? 'TYPE' : 'DIRECTION'}</span>
                                <span>{isCSVMode ? 'CONTRACT' : 'SETUP'}</span>
                                <span>P&L</span>
                                <span>STATUS</span>
                            </div>
                            <div className={styles.ptBody}>
                                {isCSVMode && csvStats ? (
                                    csvStats.trades.map(t => (
                                        <div key={t.id} className={styles.ptRow}>
                                            <span className={styles.tDate}>{t.dateStr}</span>
                                            <span className={styles.tSym}>{t.symbol.replace('USD', '/USD')}</span>
                                            <span className={t.type === 'profit' ? styles.tagLong : styles.tagShort}>
                                                {t.type === 'profit' ? 'PROFIT' : 'LOSS'}
                                            </span>
                                            <span className={styles.tSetup}>{t.symbol}</span>
                                            <span className={t.amount >= 0 ? styles.textGreen : styles.textRed} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem' }}>
                                                <span>${t.amount.toFixed(2)}</span>
                                                <span style={{ fontSize: '0.7rem', color: '#888' }}>₹{(t.amount * USD_TO_INR).toFixed(2)}</span>
                                            </span>
                                            <span>
                                                <span className={`${styles.statusBadge} ${t.type === 'profit' ? styles.bgGreen : styles.bgRed}`}>
                                                    {t.type === 'profit' ? 'WIN' : 'LOSS'}
                                                </span>
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    trades.map(t => (
                                        <div key={t.id} className={styles.ptRow} onClick={() => setSelectedTrade(t)}>
                                            <span className={styles.tDate}>{t.dateStr}</span>
                                            <span className={styles.tSym}>{t.symbol}</span>
                                            <span className={t.direction === 'LONG' ? styles.tagLong : styles.tagShort}>{t.direction}</span>
                                            <span className={styles.tSetup}>{t.setup || '-'}</span>
                                            <span className={t.pnl >= 0 ? styles.textGreen : styles.textRed} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem' }}>
                                                <span>${t.pnl.toFixed(2)}</span>
                                                <span style={{ fontSize: '0.7rem', color: '#888' }}>₹{(t.pnl * USD_TO_INR).toFixed(2)}</span>
                                            </span>
                                            <span>
                                                <span className={`${styles.statusBadge} ${t.status === 'WIN' ? styles.bgGreen : t.status === 'LOSS' ? styles.bgRed : styles.bgGrey}`}>
                                                    {t.status}
                                                </span>
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                     </div>
                )}
            </div>

            {/* MODALS (FORM & DETAILS) */}
            {isFormOpen && (
                <div className={styles.proModalOverlay}>
                    <div className={styles.proModal}>
                        <div className={styles.pmHeader}>RECORD NEW TRADE</div>
                        <form onSubmit={handleAddTrade} className={styles.pmForm}>
                            <div className={styles.pmGrid}>
                                <div className={styles.fieldGroup}>
                                    <label>SYMBOL</label>
                                    <input value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} placeholder="BTC" required />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label>DIRECTION</label>
                                    <select value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value})}>
                                        <option value="LONG">LONG</option>
                                        <option value="SHORT">SHORT</option>
                                    </select>
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label>ENTRY PRICE</label>
                                    <input type="number" step="any" value={formData.entryPrice} onChange={e => setFormData({...formData, entryPrice: e.target.value})} required/>
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label>EXIT PRICE</label>
                                    <input type="number" step="any" value={formData.exitPrice} onChange={e => setFormData({...formData, exitPrice: e.target.value})} required/>
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label>INVESTED AMOUNT</label>
                                    <input type="number" value={formData.amountInvested} onChange={e => setFormData({...formData, amountInvested: e.target.value})} required/>
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label>SETUP / STRATEGY</label>
                                    <input value={formData.setup} onChange={e => setFormData({...formData, setup: e.target.value})} placeholder="e.g. Breakout" />
                                </div>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>EXECUTION NOTES</label>
                                <textarea value={formData.mistakes} onChange={e => setFormData({...formData, mistakes: e.target.value})} rows={3} placeholder="What went right? What went wrong?"/>
                            </div>
                            <div className={styles.pmActions}>
                                <button type="button" onClick={() => setIsFormOpen(false)} className={styles.btnSec}>CANCEL</button>
                                <button type="submit" className={styles.btnPri}>SAVE TRADE</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
