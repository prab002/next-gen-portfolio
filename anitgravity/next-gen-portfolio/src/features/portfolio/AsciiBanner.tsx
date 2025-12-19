import React, { useState, useEffect, useRef } from 'react';
import styles from './PortfolioTerminal.module.css';

const ASCII_SHORT = `
 ____   ____      _    ____  
|  _ \\ |  _ \\    / \\  | __ ) 
| |_) || |_) |  / _ \\ |  _ \\ 
|  __/ |  _ <  / ___ \\| |_) |
|_|    |_| \\_\\/_/   \\_\\____/ 
`;

const ASCII_LONG = `
  ____  ____      _    ____  _   _    _    _   _     _   _    _   _ 
 |  _ \\|  _ \\    / \\  | __ )| | | |  / \\  | \\ | |   | | / \\  | \\ | |
 | |_) | |_) |  / _ \\ |  _ \\| |_| | / _ \\ |  \\| |_  | |/ _ \\ |  \\| |
 |  __/|  _ <  / ___ \\| |_) |  _  |/ ___ \\| |\\  | |_| / ___ \\| |\\  |
 |_|   |_| \\_\\/_/   \\_\\____/|_| |_/_/   \\_\\_| \\_|\\___/_/   \\_\\_| \\_|
`;

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-=[]{}|;:,.<>?";

export const AsciiBanner = () => {
  const [displayText, setDisplayText] = useState(ASCII_SHORT);
  const [targetText, setTargetText] = useState(ASCII_SHORT);
  const [isHovered, setIsHovered] = useState(false);
  
  const frameRef = useRef<number>(0);
  const iterations = useRef<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const animate = () => {
        // Split into lines
        const currentLines = displayText.split('\n');
        const targetLines = targetText.split('\n');
        
        // Ensure we have enough lines in current to match target (pad with empty if needed)
        const maxLines = Math.max(currentLines.length, targetLines.length);
        
        const nextLines = [];

        let complete = true;

        for (let i = 0; i < maxLines; i++) {
            const currentLine = currentLines[i] || '';
            const targetLine = targetLines[i] || '';
            const maxLength = Math.max(currentLine.length, targetLine.length);
            
            let nextLine = '';
            
            for (let j = 0; j < maxLength; j++) {
                const charCurrent = currentLine[j] || ' ';
                const charTarget = targetLine[j] || ' ';
                
                if (charCurrent !== charTarget) {
                    complete = false;
                    // Random chance to snap to target or show random char
                    if (Math.random() < 0.1 + (iterations.current * 0.01)) {
                        nextLine += charTarget;
                    } else {
                        nextLine += CHARS[Math.floor(Math.random() * CHARS.length)];
                    }
                } else {
                    nextLine += charCurrent;
                }
            }
            nextLines.push(nextLine);
        }

        setDisplayText(nextLines.join('\n'));
        iterations.current += 1;

        if (!complete) {
           frameRef.current = requestAnimationFrame(animate);
        } else {
            iterations.current = 0;
        }
    };
    
    // Instead of RAF loop which might be too fast/fluid for "hacker" feel, let's use a standard interval for control
    if (displayText !== targetText) {
         interval = setInterval(() => {
            const currentLines = displayText.split('\n');
            const targetLines = targetText.split('\n');
            const maxLines = Math.max(currentLines.length, targetLines.length);
            const nextLines = [];
            let complete = true;

            for (let i = 0; i < maxLines; i++) {
                const currentLine = currentLines[i] || '';
                const targetLine = targetLines[i] || '';
                const maxLength = Math.max(currentLine.length, targetLine.length);
                
                let nextLine = '';
                
                for (let j = 0; j < maxLength; j++) {
                    const charCurrent = currentLine[j] || ' ';
                    const charTarget = targetLine[j] || ' ';
                    
                    if (charCurrent === charTarget) {
                        nextLine += charCurrent;
                    } else {
                        complete = false;
                        // Acceleration factor: easier to resolve as time goes on
                        if (Math.random() < 0.2 + (iterations.current * 0.05)) {
                            nextLine += charTarget;
                        } else {
                             nextLine += CHARS[Math.floor(Math.random() * CHARS.length)];
                        }
                    }
                }
                nextLines.push(nextLine);
            }
            
            setDisplayText(nextLines.join('\n'));
            iterations.current++;

            if (complete) {
                clearInterval(interval);
                iterations.current = 0;
            }
         }, 30); // 30ms per frame
    }

    return () => clearInterval(interval);
  }, [targetText, displayText]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setTargetText(ASCII_LONG);
    iterations.current = 0;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTargetText(ASCII_SHORT);
    iterations.current = 0;
  };

  return (
    <pre 
        className={styles.asciiArt} 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer', whiteSpace: 'pre' }}
    >
        {displayText}
    </pre>
  );
};
