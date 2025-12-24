"use client";

import React from 'react';
import { ContributionDay } from './services/github';
import styles from './PortfolioTerminal.module.css';

interface ReactorCoreProps {
  data: ContributionDay[];
}

export const ReactorCore = ({ data }: ReactorCoreProps) => {
  // Calculate total for "Power Level"
  const totalContributions = data.reduce((acc, curr) => acc + curr.count, 0);
  const efficiency = Math.min(100, Math.round((totalContributions / 40) * 100)); // Arbitrary target

  return (
    <div className={styles.reactorContainer}>
      <div className={styles.reactorHeader}>
        <span className={styles.reactorTitle}>OPS_CENTER // SIGNAL_RATES</span>
        <span className={styles.reactorStatus}>
           CORE_EFFICIENCY: <span style={{ color: parseEfficiencyColor(efficiency) }}>{efficiency}%</span>
        </span>
      </div>

      <div className={styles.fuelRodContainer}>
        {data.map((day, i) => (
          <div key={day.date} className={styles.fuelRodWrapper} title={`${day.count} commits on ${day.date}`}>
             <div 
               className={styles.fuelRod} 
               style={{ 
                 height: `${Math.max(10, day.level * 25)}%`,
                 backgroundColor: getRodColor(day.level),
                 animationDelay: `${i * 0.1}s` 
               }} 
             />
             <div className={styles.fuelDate}>{day.date.slice(5)}</div>
          </div>
        ))}
      </div>
      
      <div className={styles.reactorFooter}>
         <div className={styles.reactorMetric}>
            LABEL: GITHUB_ACTIVITY
         </div>
         <div className={styles.reactorMetric}>
            RANGE: 14_CYCLES
         </div>
      </div>
    </div>
  );
};

const getRodColor = (level: number) => {
    switch(level) {
        case 0: return '#1a1a1a'; // Inert
        case 1: return '#0e4429'; // Low
        case 2: return '#006d32'; // Med
        case 3: return '#26a641'; // High
        case 4: return '#39d353'; // Critical
        default: return '#1a1a1a';
    }
};

const parseEfficiencyColor = (eff: number) => {
    if (eff > 80) return '#39d353';
    if (eff > 50) return '#e0e020';
    return '#888';
};
