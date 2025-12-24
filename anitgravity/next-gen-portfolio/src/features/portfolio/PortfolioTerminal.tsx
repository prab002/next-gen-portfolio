"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Project } from './types';
import { PROJECTS } from './projects.data';
import { ProjectTerminal } from './ProjectTerminal';
import { AsciiBanner } from './AsciiBanner';
import { WhoAmI } from './WhoAmI';
import { PreviewSidebar } from './PreviewSidebar';
import { ReactorCore } from './ReactorCore';
import { getMockContributions } from './services/github';
import styles from './PortfolioTerminal.module.css';

interface CommandOutput {
  command: string;
  output: React.ReactNode;
}

const AIResponse = ({ query }: { query: string }) => {
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    // Simulate AI thinking time
    const timer = setTimeout(() => {
      setLoading(false);
      // Mock AI Logic
      const q = query.toLowerCase();
      if (q.includes('skill') || q.includes('tech')) {
        setAnswer("Based on my analysis of the projects, the user is proficient in: Next.js, React, TypeScript, WebGL/Three.js, Python, and Solidity.");
      } else if (q.includes('contact') || q.includes('email') || q.includes('touch')) {
        setAnswer("You can reach the author via encrypted channel at: contact@prab.dev (simulated).");
      } else if (q.includes('about') || q.includes('who')) {
        setAnswer("Prab is a creative developer focused on high-performance web applications and interactive 3D experiences.");
      } else {
        setAnswer(`Processing query: "${query}"... \nAnalysis complete. This is a simulated AI response. Try asking about 'skills', 'contact', or 'about'.`);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [query]);

  if (loading) return <div className={styles.aiThinking}>AI is processing...</div>;
  
  return (
    <div className={styles.aiResponse}>
      <strong>AI Assistant:</strong>
      <p style={{ marginTop: '0.5rem' }}>{answer}</p>
    </div>
  );
};

type ViewMode = 'portfolio' | 'whoami' | 'updates' | 'blogs';

export const PortfolioTerminal = () => {
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [input, setInput] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('portfolio');
  const [currentSkill, setCurrentSkill] = useState('');
  const [previewProjects, setPreviewProjects] = useState<Project[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const HELP_TEXT = `
  - ls              : List all projects
  - open <project>  : Open a specific project by slug or ID
  - ai <query>      : Ask AI Assistant (e.g., 'ai skills', 'ai background')
  - help            : Show this help message
  - clear           : Clear terminal history
  - whoami          : Display current user
  `;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (cmd: string) => {
    const cleanCmd = cmd.trim();
    const cleanCmdLower = cleanCmd.toLowerCase();
    
    if (!cleanCmd) return;

    let response: React.ReactNode = '';

    if (cleanCmdLower === 'help') {
      response = <div className={styles.response}>{HELP_TEXT}</div>;
    } else if (cleanCmdLower === 'ls') {
      response = (
        <div className={styles.projectGrid}>
          {PROJECTS.map(p => (
            <div key={p.id} className={styles.dashboardCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>{p.title}</div>
                <div className={styles.cardValue}>{p.tags[0] || 'Web App'}</div>
              </div>
              <p style={{ color: '#888', fontSize: '0.9rem', flex: 1 }}>{p.description}</p>
              
              <div className={styles.cardFooter}>
                <div className={styles.cardIcon}>⚡</div>
                <div 
                  className={styles.cardAction}
                  onClick={() => {
                    handleCommand(`open ${p.slug}`);
                  }}
                >
                  View Project ➜
                </div>
              </div>
            </div>
          ))}
          <div className={styles.response} style={{ marginTop: '1rem', color: 'var(--color-text-muted)', gridColumn: '1/-1' }}>
            Type <span className={styles.highlight}>open &lt;slug&gt;</span> or click 'View Project'
          </div>
        </div>
      );
    } else if (cleanCmdLower.startsWith('open ')) {
      const target = cleanCmdLower.replace('open ', '').trim();
      const project = PROJECTS.find(p => 
        p.slug.toLowerCase() === target || p.id === target || p.title.toLowerCase() === target
      );

      if (project) {
        response = <span className={styles.success}>Opening project: {project.title}...</span>;
        // Delay slighty for effect
        setTimeout(() => setActiveProject(project), 500);
      } else {
        response = <span className={styles.error}>Project not found: {target}. Type 'ls' to see available projects.</span>;
      }
    } else if (cleanCmdLower === 'clear') {
      setHistory([]);
      setInput('');
      return;
    } else if (cleanCmdLower === 'whoami') {
      setCurrentView('whoami');
      response = <div className={styles.response}>Initializing WhoAmI Protocol...</div>;
      // Optionally just switch the view instead of printing to terminal, or both.
    } else if (cleanCmdLower === 'ai' || cleanCmdLower.startsWith('ai ')) {
       const query = cleanCmdLower.startsWith('ai ') ? cleanCmdLower.replace('ai ', '').trim() : '';
       if (query) {
         response = <AIResponse query={query} />;
       } else {
         response = <span className={styles.response}>Please provide a query, e.g., <span className={styles.highlight}>'ai skills'</span> or <span className={styles.highlight}>'ai contact'</span>.</span>;
       }
    } else {
      response = <span className={styles.error}>Command not found: {cleanCmd}. Type 'help' for instructions.</span>;
    }

    setHistory(prev => [...prev, { command: cmd, output: response }]);
    setInput('');
  };

  const handleSkillSelect = (skill: string) => {
    // 1. Visual feedback in terminal
    const signalMsg = (
        <div className={styles.response}>
            <span className={styles.success}>⚡ DETECTED SIGNAL: MATRIX_NODE[{skill}]</span>
            <br/>
            <span className={styles.aiThinking}>Initiating query protocol...</span>
        </div>
    );
    setHistory(prev => [...prev, { command: `signal_intercept: ${skill}`, output: signalMsg }]);
    
    setCurrentSkill(skill);

    // 2. Filter logic
    const matchingProjects = PROJECTS.filter(p => 
        p.tags.some(t => t.toLowerCase().includes(skill.toLowerCase())) ||
        p.description.toLowerCase().includes(skill.toLowerCase()) ||
        p.title.toLowerCase().includes(skill.toLowerCase())
    );

    // 3. Display results
    setPreviewProjects(matchingProjects);
    setIsPreviewOpen(true);

    let output: React.ReactNode;
    if (matchingProjects.length > 0) {
        output = (
            <div className={styles.projectGrid}>
              <div className={styles.response} style={{ gridColumn: '1/-1', marginBottom: '0.5rem' }}>
                Found {matchingProjects.length} projects matching module "{skill}":
              </div>
              {matchingProjects.map(p => (
                <div key={p.id} className={styles.dashboardCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>{p.title}</div>
                    <div className={styles.cardValue}>{p.tags[0] || 'Web App'}</div>
                  </div>
                  <p style={{ color: '#888', fontSize: '0.9rem', flex: 1 }}>{p.description}</p>
                  
                  <div className={styles.cardFooter}>
                    <div className={styles.cardIcon}>⚡</div>
                    <div 
                      className={styles.cardAction}
                      onClick={() => handleCommand(`open ${p.slug}`)}
                    >
                      View Project ➜
                    </div>
                  </div>
                </div>
              ))}
            </div>
        );
    } else {
        output = (
            <div className={styles.error}>
                No projects linked to node "{skill}". System recommends: Expand dataset.
            </div>
        );
    }
    
    // Delay to simulate processing, then show result and switch view if needed
    setTimeout(() => {
        setHistory(prev => [...prev, { command: `query_result: ${skill}`, output }]);
        // Optional: Switch back to portfolio view to see the list better? 
        // Or just keep in terminal history. Let's keep current view but scroll to bottom.
        // If we want to force user to see it, maybe switch to 'portfolio' effectively?
        // Actually, let's switch to 'portfolio' so they see the terminal output clearly if they were in 'whoami'
        // But 'whoami' also has the terminal output... 
        // Let's stay in 'whoami' so they can click more nodes!  
        // But the terminal output area might be small if current view is whoami.
        // Let's force scroll.
    }, 600);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const renderContent = () => {
    switch (currentView) {
      case 'portfolio':
        return (
          <>
            <AsciiBanner />
            <div className={styles.missionHeader}>
              <span className={styles.missionIcon}>⦿</span>
              <span>Objective: Explore Digital Frontier</span>
              <span className={styles.missionAgent}>Agent: Visitor(Lead)</span>
            </div>
    
            <div className={styles.helpHint}>
              <p>Available Protocols:</p>
              <ul>
                <li><span className={styles.highlight}>ls</span> - List projects</li>
                <li><span className={styles.highlight}>open &lt;name&gt;</span> - View project details</li>
                <li><span className={styles.highlight}>ai</span> - Ask AI assistant</li>
                <li><span className={styles.highlight}>whoami</span> - About me</li>
                <li><span className={styles.highlight}>help</span> - Show full help menu</li>
              </ul>
            </div>
          </>
        );
      case 'whoami':
        return <WhoAmI onSkillSelect={handleSkillSelect} />;
      case 'updates':
        return (
            <div className={styles.response}>
                <div style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>SYSTEM: CONNECTED TO GITHUB_NET</div>
                <ReactorCore data={getMockContributions()} />
                <div style={{ marginTop: '2rem', color: '#666', fontStyle: 'italic' }}>
                   Latest Patch: v2.1.0 - Neural Link & OpsCenter Online.
                </div>
            </div>
        );
      case 'blogs':
        return <div className={styles.response}>Accessing Blog Network... No signals found. (Coming Soon)</div>;
      default:
        return null;
    }
  };

  if (activeProject) {
    return <ProjectTerminal project={activeProject} onExit={() => setActiveProject(null)} />;
  }

  return (
    <div className={styles.terminalContainer} onClick={focusInput}>
       <div className={styles.tacticalStatusBar}>
        <div className={styles.statusGroup}>
          <span className={styles.statusLabel}>REF:</span>
          <span className={styles.statusValue}>PRAB-PF-V2</span>
        </div>
        <div className={styles.statusGroup}>
          <span className={styles.statusDot} />
          <span className={styles.statusValue}>SYSTEM ONLINE</span>
        </div>
        <div className={styles.statusGroup}>
          <span className={styles.statusLabel}>SEC:</span>
          <span className={`${styles.statusValue} ${styles.alert}`}>HIGH</span>
        </div>
        <div className={styles.statusGroup} style={{ marginLeft: 'auto' }}>
          <span className={styles.statusValue}>{new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>

      <div className={styles.terminalContainerInner} style={{ flexDirection: 'row', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        
        <div className={styles.welcomeMessage}>
          {/* Navigation Bar */}
          <div className={styles.dashboardHeader}>
            <div className={styles.navPills}>
              <span 
                className={`${styles.navPill} ${currentView === 'portfolio' ? styles.active : ''}`}
                onClick={() => setCurrentView('portfolio')}
              >
                portfolio
              </span>
              <span 
                className={`${styles.navPill} ${currentView === 'whoami' ? styles.active : ''}`}
                onClick={() => setCurrentView('whoami')}
              >
                whoami
              </span>
              <span 
                className={`${styles.navPill} ${currentView === 'updates' ? styles.active : ''}`}
                onClick={() => setCurrentView('updates')}
              >
                updates
              </span>
              <span 
                className={`${styles.navPill} ${currentView === 'blogs' ? styles.active : ''}`}
                onClick={() => setCurrentView('blogs')}
              >
                Blogs
              </span>
            </div>
          </div>
  
          {renderContent()}
        </div>

        <div className={styles.outputArea}>
            <div className={styles.activityLogTitle}>
            <span className={styles.logIcon}>⚡</span> Activity Log
            </div>
            {history.map((entry, i) => (
            <div key={i}>
                <div className={styles.commandLine}>
                <span className={styles.prompt}>visitor@portfolio:~$</span>
                <span className={styles.command}>{entry.command}</span>
                </div>
                <div>{entry.output}</div>
            </div>
            ))}
            
            <div className={styles.inputLine}>
            <span className={styles.prompt}>visitor@portfolio:~$</span>
            <input
                ref={inputRef}
                type="text"
                className={styles.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCommand(input)}
                autoFocus
                autoComplete="off"
                spellCheck="false"
                placeholder="Type 'help', 'ls' or ask 'ai'..."
            />
            </div>
            <div ref={bottomRef} />
        </div>
        </div>
        
        <PreviewSidebar 
            isOpen={isPreviewOpen} 
            currentSkill={currentSkill}
            projects={previewProjects}
            onClose={() => setIsPreviewOpen(false)}
            onOpenProject={(slug) => handleCommand(`open ${slug}`)}
        />
      </div>
    </div>
  );
};
