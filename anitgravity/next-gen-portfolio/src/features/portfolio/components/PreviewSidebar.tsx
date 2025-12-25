"use client";

import React from 'react';
import styles from '../styles/PortfolioTerminal.module.css';
import { Project } from '../types/types';
import { ProjectCard } from './ProjectCard';

interface PreviewSidebarProps {
  isOpen: boolean;
  currentSkill: string;
  projects: Project[];
  onClose: () => void;
  onOpenProject: (slug: string) => void;
}

export const PreviewSidebar = ({ 
  isOpen, 
  currentSkill, 
  projects, 
  onClose,
  onOpenProject
}: PreviewSidebarProps) => {
  return (
    <div className={`${styles.previewSidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarHeader}>
        <div>
           <div className={styles.sidebarLabel}>LINKED MODULES</div>
           <div className={styles.sidebarSkill}>{currentSkill}</div>
        </div>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      <div className={styles.sidebarContent}>
        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No modules connected to this node.</span>
          </div>
        ) : (
          projects.map(p => (
            <div key={p.id} className={styles.previewCard} onClick={() => onOpenProject(p.slug)}>
               <div className={styles.previewThumbnail} style={{ background: p.imageUrl || '#333' }}>
                  {/* Placeholder for real image */}
               </div>
               <div className={styles.previewInfo}>
                  <div className={styles.previewTitle}>{p.title}</div>
                  <div className={styles.previewDesc}>{p.description.substring(0, 60)}...</div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
