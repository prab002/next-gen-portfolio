"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Project } from './types/types';
import { StreamingText } from '../ai/StreamingText';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import styles from './styles/ProjectTerminal.module.css';

interface CommandOutput {
  command: string;
  output: React.ReactNode;
}

export const ProjectTerminal = ({ project, onExit }: { project: Project; onExit?: () => void }) => {
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [input, setInput] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const HELP_TEXT = `
  Available commands:
  - ls              : List project files/assets
  - cat features    : Show key features
  - cat tech        : Show technology stack
  - run demo        : Launch live demo (if available)
  - exit            : Return to portfolio
  - clear           : Clear terminal
  `;

  useEffect(() => {
    // Simulate boot sequence
    const bootTimer = setTimeout(() => setIsBooting(false), 2000);
    return () => clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isBooting]);

  const handleCommand = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase();
    let response: React.ReactNode = '';

    switch (cleanCmd) {
      case 'help':
        response = <div className={styles.pre}>{HELP_TEXT}</div>;
        break;
      case 'ls':
        response = (
          <div className={styles.grid}>
             <span>README.md</span>
             <span>features.json</span>
             <span>tech-stack.yml</span>
             <span className={styles.executable}>demo.exe</span>
          </div>
        );
        break;
      case 'cat features':
        response = (
          <ul className={styles.list}>
            <li>{project.description}</li>
            {project.stats?.map(s => <li key={s.label}>{s.label}: {s.value}</li>)}
          </ul>
        );
        break;
      case 'cat tech':
        response = (
          <div className={styles.tags}>
            {project.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
          </div>
        );
        break;
      case 'run demo':
        response = <span className="text-secondary">Launching demo environment... Accessing {project.link}</span>;
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      case 'exit':
         response = <span className="text-accent">Terminating session...</span>;
         if (onExit) {
            setTimeout(onExit, 800);
         }
         break;
      default:
        response = <span className="text-error">Command not found: {cmd}. Type 'help' for instructions.</span>;
    }

    setHistory(prev => [...prev, { command: cmd, output: response }]);
    setInput('');
  };

  if (isBooting) {
    return (
      <div className={styles.bootScreen}>
        <StreamingText text={`Loading project data for: ${project.title}...`} speed={30} />
        <div className={styles.loader} />
      </div>
    );
  }

  return (
    <div className={styles.terminalContainer}>
      <div className={styles.navBar}>
        <div className={styles.windowControls}>
           <button onClick={onExit} className={styles.closeBtn} title="Exit">×</button>
        </div>
        <div className={styles.windowTitle}>root@portfolio:~/projects/{project.id}</div>
      </div>

      <div className={styles.terminalBody} onClick={() => document.getElementById('term-input')?.focus()}>
        <div className={styles.welcomeMessage}>
          <p>Connected to {project.title} secure server.</p>
          <p className="text-muted">Type 'help' to see available commands.</p>
        </div>

        {history.map((entry, i) => (
          <div key={i} className={styles.historyItem}>
            <div className={styles.commandLine}>
              <span className={styles.prompt}>➜</span>
              <span className={styles.command}>{entry.command}</span>
            </div>
            <div className={styles.output}>{entry.output}</div>
          </div>
        ))}

        <div className={styles.inputLine}>
          <span className={styles.prompt}>➜</span>
          <input
            id="term-input"
            type="text"
            className={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCommand(input)}
            autoFocus
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
