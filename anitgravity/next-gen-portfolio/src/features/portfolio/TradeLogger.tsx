import React, { useState, useEffect, useMemo, useRef } from 'react';
import styles from './PortfolioTerminal.module.css';
import { parseCSV, calculatePortfolioStats, loadCSVFromFile, PortfolioStats } from './utils/csvParser';

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

export const TradeLogger = () => {
    const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
    const [initialCapital, setInitialCapital] = useState<number>(10000);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [csvStats, setCsvStats] = useState<PortfolioStats | null>(null);
    const [isCSVMode, setIsCSVMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                totalFunding: csvStats.totalFunding
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
            totalFunding: 0
        };
    }, [trades, initialCapital, isCSVMode, csvStats]);

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
        <div className={styles.tradelApp}>
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
                </div>
                <div className={styles.sidebarFooter}>
                    <div className={styles.accountStatus}>
                        <span>BALANCE</span>
                        <strong>${analytics.currentBalance.toFixed(2)}</strong>
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
                                    ${analytics.totalPnl.toFixed(2)}
                                </div>
                            </div>
                            <div className={styles.proKpi}>
                                <div className={styles.proLabel}>CURRENT BALANCE</div>
                                <div className={styles.proValue}>${analytics.currentBalance.toFixed(2)}</div>
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
                                            -${analytics.totalFees.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>LIQUIDATION FEES</div>
                                        <div className={`${styles.proValue} ${styles.textRed}`}>
                                            -${analytics.totalLiquidationFees.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className={styles.proKpi}>
                                        <div className={styles.proLabel}>FUNDING</div>
                                        <div className={`${styles.proValue} ${analytics.totalFunding >= 0 ? styles.textGreen : styles.textRed}`}>
                                            ${analytics.totalFunding.toFixed(2)}
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
                                                    <span style={{ fontSize: '0.7rem', color: '#888', display: 'block', marginTop: '0.25rem' }}>
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
                                            <span className={t.amount >= 0 ? styles.textGreen : styles.textRed}>
                                                ${t.amount.toFixed(2)}
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
                                            <span className={t.pnl >= 0 ? styles.textGreen : styles.textRed}>
                                                ${t.pnl.toFixed(2)}
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
