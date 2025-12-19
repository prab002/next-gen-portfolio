"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Project } from './types';
import { PROJECTS } from './projects.data';
import { ProjectTerminal } from './ProjectTerminal';
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

export const PortfolioTerminal = () => {
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [input, setInput] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
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
      response = <div className={styles.response}>visitor@portfolio</div>;
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

  const focusInput = () => {
    inputRef.current?.focus();
  };

  if (activeProject) {
    return <ProjectTerminal project={activeProject} onExit={() => setActiveProject(null)} />;
  }

  return (
    <div className={styles.terminalContainer} onClick={focusInput}>
      <div className={styles.welcomeMessage}>
        {/* Navigation Bar */}
        <div className={styles.dashboardHeader}>
          <div className={styles.navPills}>
            <span className={`${styles.navPill} ${styles.active}`}>Portfolio</span>
            <span className={styles.navPill}>Launches</span>
            <span className={styles.navPill}>Products</span>
            <span className={styles.navPill}>Company</span>
          </div>
        </div>

        <pre className={styles.asciiArt}>
{`
 ____   ____      _    ____  
|  _ \\ |  _ \\    / \\  | __ ) 
| |_) || |_) |  / _ \\ |  _ \\ 
|  __/ |  _ <  / ___ \\| |_) |
|_|    |_| \\_\\/_/   \\_\\____/ 
`}
        </pre>
        <p>Welcome to Prab's Interactive Portfolio v2.0</p>
        <div className={styles.helpHint}>
          <p>Available Commands:</p>
          <ul>
            <li><span className={styles.highlight}>ls</span> - List projects</li>
            <li><span className={styles.highlight}>open &lt;name&gt;</span> - View project details</li>
            <li><span className={styles.highlight}>ai</span> - Ask AI assistant</li>
            <li><span className={styles.highlight}>whoami</span> - About me</li>
            <li><span className={styles.highlight}>help</span> - Show full help menu</li>
          </ul>
        </div>
      </div>

      <div className={styles.outputArea}>
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
  );
};
