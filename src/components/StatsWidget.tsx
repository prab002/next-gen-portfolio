export default function StatsWidget({ stats }: { stats: any }) {
  return (
    <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      <div className="card">
        <div className="label">Total Trades</div>
        <div className="text-lg font-bold">{stats.totalTrades}</div>
      </div>
      <div className="card">
        <div className="label">Win Rate</div>
        <div className={`text-lg font-bold ${stats.winRate >= 50 ? 'text-success' : 'text-danger'}`}>
          {stats.winRate.toFixed(1)}%
        </div>
      </div>
      <div className="card">
        <div className="label">Total P&L</div>
        <div className={`text-lg font-bold ${stats.totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
          ${stats.totalPnL.toFixed(2)}
        </div>
      </div>
      <div className="card">
        <div className="label">Wins / Losses</div>
        <div className="text-lg font-bold">
          <span className="text-success">{stats.wins}</span> / <span className="text-danger">{stats.losses}</span>
        </div>
      </div>
    </div>
  );
}
