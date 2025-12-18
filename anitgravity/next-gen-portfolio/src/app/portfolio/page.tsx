import React from 'react';
import { Header } from '@/components/layout/Header/Header';
import { ProjectCard } from '@/features/portfolio/ProjectCard';
import { PROJECTS } from '@/features/portfolio/projects.data';
import styles from './page.module.css';

export default function PortfolioPage() {
  return (
    <main className={styles.main}>
      <Header />
      
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1 className={styles.title}>
            Selected <span className="text-gradient">Works</span>
          </h1>
          <p className={styles.subtitle}>
            A curation of digital products, experiments, and architectural systems.
          </p>
        </header>

        <div className={styles.grid}>
          {PROJECTS.map((project, index) => (
            <div 
              key={project.id} 
              className={styles.cardWrapper}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
