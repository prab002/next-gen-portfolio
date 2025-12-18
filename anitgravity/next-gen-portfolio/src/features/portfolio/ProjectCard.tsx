import React from 'react';
import { Project } from './types';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import styles from './ProjectCard.module.css';

export const ProjectCard = ({ project }: { project: Project }) => {
  return (
    <Card className={styles.projectCard} hoverEffect={true}>
      <div 
        className={styles.imagePlaceholder} 
        style={{ background: project.imageUrl }}
      >
        <div className={styles.overlay}>
          <Button size="sm" variant="secondary" className={styles.viewBtn}>View Project</Button>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{project.title}</h3>
          {project.featured && <span className={styles.featuredBadge}>Featured</span>}
        </div>
        
        <p className={styles.description}>{project.description}</p>
        
        <div className={styles.tags}>
          {project.tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>

        {project.stats && (
          <div className={styles.stats}>
            {project.stats.map(stat => (
              <div key={stat.label} className={styles.statItem}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
