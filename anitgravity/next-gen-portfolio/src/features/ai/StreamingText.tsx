import React, { useState, useEffect } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export const StreamingText = ({ 
  text, 
  speed = 30, 
  onComplete,
  className = ''
}: StreamingTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    
    const intervalId = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, speed);
    
    return () => clearInterval(intervalId);
  }, [text, speed, onComplete]);

  return <span className={className}>{displayedText}</span>;
};
