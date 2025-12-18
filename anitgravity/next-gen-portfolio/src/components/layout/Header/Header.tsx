import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import styles from './Header.module.css';

export const Header = () => {
  return (
    <header className={`${styles.header} glass-panel`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          IO<span className="text-gradient">.DEV</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="#portfolio" className={styles.link}>Portfolio</Link>
          <Link href="#ai-lab" className={styles.link}>AI Lab</Link>
          <Link href="#about" className={styles.link}>About</Link>
        </nav>
        <Button size="sm" variant="primary" glow>Let's Talk</Button>
      </div>
    </header>
  );
};
