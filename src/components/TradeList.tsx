export default function TradeList({ trades }: { trades: any[] }) {
  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-4">Recent Trades</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Date</th>
              <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Symbol</th>
              <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Type</th>
              <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Entry</th>
              <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Exit</th>
              <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>P&L</th>
              <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const pnl = trade.exitPrice ? (trade.exitPrice - trade.entryPrice) * trade.quantity - (trade.fees || 0) : null;
              return (
                <tr key={trade.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>{new Date(trade.entryDate).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{trade.symbol}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      background: trade.type === 'BUY' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: trade.type === 'BUY' ? 'var(--success)' : 'var(--danger)',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {trade.type}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>${trade.entryPrice}</td>
                  <td style={{ padding: '0.75rem' }}>{trade.exitPrice ? `$${trade.exitPrice}` : '-'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold', color: pnl && pnl > 0 ? 'var(--success)' : pnl && pnl < 0 ? 'var(--danger)' : 'inherit' }}>
                    {pnl ? `$${pnl.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{trade.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
