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

export const PortfolioTerminal = () => {
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [input, setInput] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const HELP_TEXT = `
  Available commands:
  - ls              : List all projects
  - open <project>  : Open a specific project by slug or ID
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
            <div key={p.id} className={styles.projectItem}>
              <div className={styles.projectHeader}>
                <span className={styles.projectTitle}>{p.title}</span>
                <span className={styles.projectSlug}>{p.slug}</span>
              </div>
              <p className={styles.projectDesc}>{p.description}</p>
              <div className={styles.tags}>
                {p.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
              </div>
            </div>
          ))}
          <div className={styles.response} style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
            Type <span className={styles.highlight}>open &lt;slug&gt;</span> to view details (e.g., 'open neon-commerce')
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
      </div>

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
        />
      </div>
      <div ref={bottomRef} />
    </div>
  );
};
