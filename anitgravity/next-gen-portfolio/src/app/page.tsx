import { Header } from '@/components/layout/Header/Header';
import { Button } from '@/components/ui/Button/Button';
import { PromptTerminal } from '@/features/ai/PromptTerminal';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <Header />
      
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '50px', display: 'inline-block', marginBottom: '1.5rem' }}>
            <span className="text-gradient" style={{ fontSize: '0.9rem', fontWeight: 600 }}>v2.0 Beta Live</span>
          </div>
          
          <h1 className={styles.title}>
            Building the <br />
            <span className="text-gradient">Next Generation</span> <br />
            of Digital Experiences
          </h1>
          
          <p className={styles.subtitle}>
            A futuristic portfolio exploring the intersection of creative design and artificial intelligence.
          </p>
          
          <div className={styles.actions}>
            <Button size="lg" glow>Explore Work</Button>
            <Button size="lg" variant="ghost">View Code</Button>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.terminalWrapper}>
            <PromptTerminal />
          </div>
        </div>
      </section>
    </main>
  );
}
