"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { StreamingText } from './StreamingText';
import styles from './PromptTerminal.module.css';

const DEMO_PROMPTS = [
  "Generate a modern portfolio hero section",
  "Design a glassmorphism card component",
  "Optimize React performance",
];

const MOCK_RESPONSES: Record<string, string> = {
  default: "Analysis complete. Generating high-fidelity UI components based on your request. Applying 'Glassmorphism' preset with haptic feedback simulations...",
  "Generate a modern portfolio hero section": "Creating infinite canvas... Injecting WebGL shaders... Done. Hero section generated with 98% accessibility score.",
};

export const PromptTerminal = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isTyping]);

  const handleSubmit = (prompt: string) => {
    if (!prompt.trim() || isTyping) return;
    
    setHistory(prev => [...prev, { role: 'user', content: prompt }]);
    setInput('');
    setIsTyping(true);

    // Simulate network delay
    setTimeout(() => {
      const response = MOCK_RESPONSES[prompt] || MOCK_RESPONSES.default;
      setHistory(prev => [...prev, { role: 'ai', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <Card className={styles.terminal} hoverEffect={true}>
      <div className={styles.header}>
        <div className={styles.dot} style={{ background: '#ff5f56' }} />
        <div className={styles.dot} style={{ background: '#ffbd2e' }} />
        <div className={styles.dot} style={{ background: '#27c93f' }} />
        <span className={styles.title}>ai-agent@portfolio ~ node</span>
      </div>

      <div className={styles.output} ref={scrollRef}>
        <div className={styles.welcome}>
          <span className="text-muted">Welcome to AI-Gen V2. Type a prompt or select a preset.</span>
        </div>
        
        {history.map((msg, idx) => (
          <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
            <span className={styles.roleLabel}>{msg.role === 'user' ? '>' : '$'}</span>
            {msg.role === 'ai' && idx === history.length - 1 ? (
               <StreamingText text={msg.content} speed={15} /> 
            ) : (
               <span>{msg.content}</span>
            )}
          </div>
        ))}
        
        {isTyping && (
           <div className={styles.message}>
             <span className={styles.roleLabel}>$</span>
             <span className={styles.cursor}>_</span>
           </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <div className={styles.suggestions}>
          {DEMO_PROMPTS.map(p => (
            <button key={p} className={styles.chip} onClick={() => handleSubmit(p)}>
              {p}
            </button>
          ))}
        </div>
        <div className={styles.inputRow}>
          <span className={styles.promptArrow}>{'>'}</span>
          <input 
            type="text" 
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(input)}
            placeholder="Describe your vision..."
          />
        </div>
      </div>
    </Card>
  );
};
