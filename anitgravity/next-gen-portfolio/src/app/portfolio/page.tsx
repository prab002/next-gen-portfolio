import React from 'react';
import { PortfolioTerminal } from '@/features/portfolio/PortfolioTerminal';
import styles from './page.module.css';

export default function PortfolioPage() {
  return (
    <main className={styles.main}>
      <PortfolioTerminal />
    </main>
  );
}
