import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/PortfolioTerminal.module.css';

const WORD_POOL = [
    'system', 'protocol', 'network', 'interface', 'matrix', 'cyber', 'data', 'node', 'link', 'access',
    'security', 'encryption', 'firewall', 'terminal', 'code', 'algorithm', 'vector', 'pixel', 'render', 'logic',
    'memory', 'cpu', 'gpu', 'server', 'client', 'proxy', 'router', 'packet', 'stream', 'buffer',
    'latency', 'bandwidth', 'cloud', 'stack', 'heap', 'queue', 'array', 'string', 'integer', 'boolean',
    'function', 'object', 'class', 'module', 'import', 'export', 'const', 'variable', 'scope', 'closure',
    'react', 'next', 'node', 'typescript', 'javascript', 'html', 'css', 'design', 'ui', 'ux'
];

const GAME_DURATION = 30;

export const SpeedTyper = () => {
    const [words, setWords] = useState<string[]>([]);
    const [userInput, setUserInput] = useState('');
    const [currWordIndex, setCurrWordIndex] = useState(0);
    const [currCharIndex, setCurrCharIndex] = useState(0); // overall char index for raw WPM? No, let's track per word
    
    // We will treat the entire text as one long string for display, but manage input word by word for validation
    // Actually, distinct word-by-word validation is easier for the "Monkeytype" feel where you space to next word.
    
    const [status, setStatus] = useState<'waiting' | 'running' | 'finished'>('waiting');
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [results, setResults] = useState({ wpm: 0, accuracy: 0, correctChars: 0, totalChars: 0 });
    
    const inputRef = useRef<HTMLInputElement>(null);

    const generateWords = useCallback(() => {
        const newWords = [];
        for (let i = 0; i < 50; i++) {
            newWords.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
        }
        setWords(newWords);
    }, []);

    useEffect(() => {
        generateWords();
    }, [generateWords]);

    useEffect(() => {
        if (status === 'waiting') {
            inputRef.current?.focus();
        }
    }, [status]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'running' && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && status === 'running') {
            finishGame();
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    const finishGame = () => {
        setStatus('finished');
        // Calculate WPM: (Total Correct Chars / 5) / (Time / 60)
        // Since fixed time is 30s, match it.
        // Actually typical formula: (All Typed Chars / 5) - Uncorrected Errors ... 
        // Simplified: (Correct Chars / 5) / (Duration / 60)
        
        // We need to calculate stats based on current state
        const timeElapsed = GAME_DURATION - timeLeft; // Should be GAME_DURATION if finished by timer
        const minutes = GAME_DURATION / 60;
        
        // Count correct chars strictly from COMPLETED words + current partial match
        // But simpler: just track correctChars state interactively? 
        // Let's iterate words up to currWordIndex
        
        // We'll calculate purely at the end for simplicity in this version, 
        // or we can track running `correctChars` count.
        // Let's use the one stored in state `results.correctChars` which we update on spacebar.
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (status === 'finished') return;
        
        if (status === 'waiting' && e.key.length === 1) {
            setStatus('running');
        }

        // We only care about spacing to next word
        if (e.key === ' ') {
            e.preventDefault(); // don't add space to input value physically if we want to clear it
            const currentWord = words[currWordIndex];
            const isCorrect = userInput === currentWord;
            
            // Update stats
            setResults(prev => ({
                ...prev,
                totalChars: prev.totalChars + userInput.length + 1, // +1 for space
                correctChars: prev.correctChars + (isCorrect ? userInput.length + 1 : 0) // rough approx
            }));

            setUserInput('');
            setCurrWordIndex(prev => prev + 1);
            
            // Generate more words if nearing end
            if (currWordIndex > words.length - 10) {
                 const moreWords: string[] = [];
                 for(let i=0; i<20; i++) moreWords.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
                 setWords(prev => [...prev, ...moreWords]);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (status === 'finished') return;
        const val = e.target.value;
        if (val.includes(' ')) return; // Handled in keydown
        setUserInput(val);
    };

    const restart = () => {
        setStatus('waiting');
        setTimeLeft(GAME_DURATION);
        setCurrWordIndex(0);
        setUserInput('');
        setResults({ wpm: 0, accuracy: 0, correctChars: 0, totalChars: 0 });
        generateWords();
        inputRef.current?.focus();
    };

    // Calculate dynamic WPM for display if needed, or just show at end
    const calculateFinalStats = () => {
         const minutes = GAME_DURATION / 60;
         const wpm = Math.round((results.correctChars / 5) / minutes);
         const acc = results.totalChars > 0 ? Math.round((results.correctChars / results.totalChars) * 100) : 100;
         return { wpm, acc };
    };

    return (
        <div className={styles.typerContainer}>
            <div className={styles.typerHeader}>
                <div className={styles.typerTitle}>SPEED_LINK PROTOCOL</div>
                <div className={styles.typerTimer} style={{ color: timeLeft < 10 ? '#ff0055' : '#00ff00' }}>
                    00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </div>
            </div>

            {status === 'finished' ? (
                <div className={styles.typerResults}>
                    <div className={styles.resultCard}>
                        <div className={styles.resultLabel}>WPM</div>
                        <div className={styles.resultValue}>{calculateFinalStats().wpm}</div>
                    </div>
                    <div className={styles.resultCard}>
                        <div className={styles.resultLabel}>ACCURACY</div>
                        <div className={styles.resultValue}>{calculateFinalStats().acc}%</div>
                    </div>
                    <button className={styles.retryBtn} onClick={restart} autoFocus>
                        RE-INITIALIZE
                    </button>
                </div>
            ) : (
                <div className={styles.typerGame} onClick={() => inputRef.current?.focus()}>
                    {/* Render Words */}
                    <div className={styles.wordStream}>
                        {words.slice(currWordIndex, currWordIndex + 20).map((word, i) => {
                            const isCurrent = i === 0;
                            // For the current word, we want to color characters
                            return (
                                <span key={currWordIndex + i} className={`${styles.tWord} ${isCurrent ? styles.activeWord : ''}`}>
                                    {word.split('').map((char, charIdx) => {
                                        let charClass = '';
                                        if (isCurrent) {
                                            if (charIdx < userInput.length) {
                                                charClass = userInput[charIdx] === char ? styles.charCorrect : styles.charIncorrect;
                                            } else if (charIdx === userInput.length) {
                                               charClass = styles.charCaret; // Not really a class on the char, but a marker
                                            }
                                        }
                                        return <span key={charIdx} className={charClass}>{char}</span>;
                                    })}
                                    {/* Extra incorrect chars if user types longer than word */}
                                    {isCurrent && userInput.length > word.length && (
                                        userInput.slice(word.length).split('').map((char, k) => (
                                            <span key={`extra-${k}`} className={`${styles.charIncorrect} ${styles.extra}`}>{char}</span>
                                        ))
                                    )}
                                    {isCurrent && <span className={styles.caret} style={{ left: `${userInput.length}ch` }}></span>}
                                </span>
                            );
                        })}
                    </div>
                    
                    <input
                        ref={inputRef}
                        className={styles.hiddenInput}
                        value={userInput}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        onBlur={(e) => e.target.focus()} // Keep focus
                    />
                    
                    <div className={styles.typerInstruction}>
                        Designed for high-speed data entry. Type the words. SPACE to advance.
                    </div>
                </div>
            )}
        </div>
    );
};
