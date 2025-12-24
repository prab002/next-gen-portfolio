import React from 'react';
import { ContributionYear, LatestActivity } from './services/github';
import styles from './PortfolioTerminal.module.css';

interface ReactorCoreProps {
  graphData: ContributionYear | null;
  latestActivity: LatestActivity | null;
}

export const ReactorCore = ({ graphData, latestActivity }: ReactorCoreProps) => {
  if (!graphData || !graphData.contributions) {
      return (
          <div className={styles.aiThinking}>
            Initializing OpsCenter... <br/>
            Running Diagnostics...
          </div>
      );
  }

  const total = Object.values(graphData.total).reduce((a, b) => a + b, 0);
  
  // Group by weeks [Sunday - Saturday]
  const weeks: any[][] = [];
  let currentWeek: any[] = [];
  
  // The API returns a flat list. Usually starts on Jan 1st.
  // We should pad the first week if standard GitHub style (columns are weeks).
  // But let's stick to the flat chunking for now, simpler.
  graphData.contributions.forEach((day, i) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || i === graphData.contributions.length - 1) {
          weeks.push(currentWeek);
          currentWeek = [];
      }
  });

  // Calculate Month Labels
  const monthLabels: React.ReactNode[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
     const date = new Date(week[0].date);
     const month = date.getMonth();
     if (month !== lastMonth) {
         monthLabels.push(
             <span key={i} style={{ flex: 1, textAlign: 'left', minWidth: '30px' }}>
                 {date.toLocaleString('default', { month: 'short' })}
             </span>
         );
         lastMonth = month;
     } else {
         // Empty placeholder for alignment
         monthLabels.push(<span key={i} style={{ flex: 1, minWidth: '13px' }} />);
     }
  });

  return (
    <div className={styles.reactorContainer}>
      <div className={styles.reactorHeader}>
        <span className={styles.reactorTitle}>
            {total.toLocaleString()} contributions in the last year
        </span>
      </div>

      <div className={styles.graphScrollWrapper}>
        {/* Month Labels - Simplified approach: specific positions */}
        <div style={{ display: 'flex', marginLeft: '0', marginBottom: '8px', fontSize: '0.75rem', color: '#8b949e', gap: '3px' }}>
            {weeks.map((week, i) => {
                 const d = new Date(week[0].date);
                 const shouldLabel = i === 0 || d.getMonth() !== new Date(weeks[i-1][0].date).getMonth();
                 return (
                     <div key={i} style={{ width: '11px', overflow: 'visible', whiteSpace: 'nowrap' }}>
                        {shouldLabel ? d.toLocaleString('default', { month: 'short' }) : ''}
                     </div>
                 );
            })}
        </div>

        <div className={styles.yearGraph}>
            {weeks.map((week, wIndex) => (
                <div key={wIndex} className={styles.weekColumn}>
                    {/* Fill incomplete weeks with transparent blocks if needed, usually fine though */}
                    {week.map((day) => (
                        <div 
                            key={day.date} 
                            className={styles.dayCell}
                            style={{ backgroundColor: getGitHubColor(day.level) }}
                            title={`${day.count} contributions on ${day.date}`}
                        />
                    ))}
                </div>
            ))}
        </div>
      </div>
      
      {latestActivity && (
          <div className={styles.latestPushSection}>
             <span>Latest Activity:</span>
             <span className={styles.pushRepo}>{latestActivity.repo}</span>
             <span className={styles.pushMsg}>{latestActivity.message.slice(0, 50)}</span>
             <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                 {new Date(latestActivity.timestamp).toLocaleDateString()}
             </span>
          </div>
      )}
    </div>
  );
};

const getGitHubColor = (level: number) => {
    // Correct GitHub standard colors (Dark Mode)
    // 0: #161b22 -> #2d333b (our custom lighter base)
    // 1: #0e4429
    // 2: #006d32
    // 3: #26a641
    // 4: #39d353
    switch(level) {
        case 0: return '#2d333b'; // Lighter base for visibility
        case 1: return '#0e4429';
        case 2: return '#006d32';
        case 3: return '#26a641';
        case 4: return '#39d353';
        default: return '#2d333b';
    }
};
