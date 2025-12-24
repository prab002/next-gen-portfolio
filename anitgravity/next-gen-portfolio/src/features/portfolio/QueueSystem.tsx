import React, { useState, useEffect, useRef } from 'react';
import styles from './PortfolioTerminal.module.css';

interface Ticket {
  id: string;
  name: string;
  status: 'waiting' | 'serving' | 'done';
  timestamp: Date;
}

export const QueueSystem = () => {
    const [queue, setQueue] = useState<Ticket[]>([]);
    const [counter, setCounter] = useState(1);
    const [nameInput, setNameInput] = useState('');
    const [nowServing, setNowServing] = useState<Ticket | null>(null);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nameInput.trim()) return;

        const newTicket: Ticket = {
            id: `P-${counter.toString().padStart(3, '0')}`,
            name: nameInput.trim(),
            status: 'waiting',
            timestamp: new Date()
        };

        setQueue(prev => [...prev, newTicket]);
        setCounter(prev => prev + 1);
        setNameInput('');
    };

    const handleCallNext = () => {
        const waiting = queue.filter(t => t.status === 'waiting');
        if (waiting.length === 0) return;

        // Move current to done
        if (nowServing) {
            setQueue(prev => prev.map(t => t.id === nowServing.id ? { ...t, status: 'done' } : t));
        }

        const next = waiting[0];
        setQueue(prev => prev.map(t => t.id === next.id ? { ...t, status: 'serving' } : t));
        setNowServing(next);
    };

    const handleAdmit = () => {
         if (nowServing) {
            setQueue(prev => prev.map(t => t.id === nowServing.id ? { ...t, status: 'done' } : t));
            setNowServing(null);
        }
    };

    const handleDirectComplete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // If it's the one currently serving, process normally
        if (nowServing && nowServing.id === id) {
            handleAdmit();
        } else {
            // Otherwise just mark as done (skipped or quick processed)
            setQueue(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t));
        }
    };

    const handleSelectForServing = (ticket: Ticket) => {
        if (nowServing) {
             setQueue(prev => prev.map(t => t.id === nowServing.id ? { ...t, status: 'done' } : t));
        }
        setQueue(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'serving' } : t));
        setNowServing(ticket);
    };

    const waitingList = queue.filter(t => t.status === 'waiting');
    const doneList = queue.filter(t => t.status === 'done').slice(-5).reverse();

    return (
        <div className={styles.queueContainer}>
            {/* PUBLIC DISPLAY (LEFT) */}
            <div className={styles.queueDisplay}>
                <div className={styles.queueHeader}>
                    <div className={styles.headerTitle}>
                        <span className={styles.statusDot}></span>
                        <span>CYBER_TRIAGE // SYSTEM_ONLINE</span>
                    </div>
                    <span className={styles.zoneId}>ZONE: A-01</span>
                </div>
                
                <div className={styles.ledScreen}>
                    <div className={styles.scanline}></div>
                    <div className={styles.ledContent}>
                        <div className={styles.ledLabel}>NOW SERVING</div>
                        <div className={styles.ledNumber}>
                            {nowServing ? nowServing.id : '---'}
                        </div>
                        <div className={styles.ledName}>
                             {nowServing ? nowServing.name : 'WAITING FOR NEXT PATIENT'}
                        </div>
                        {nowServing && <div className={styles.turnSignal}>PLEASE PROCEED TO COUNTER 1</div>}
                    </div>
                </div>

                <div className={styles.upNextList}>
                     <div className={styles.listHeader}>
                        <span>WAITING LIST ({waitingList.length})</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>SELECT TO CALL</span>
                     </div>
                     
                     <div className={styles.scrollArea}>
                        {waitingList.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span>ALL PATIENTS CLEARED</span>
                            </div>
                        ) : (
                            waitingList.map((t, i) => (
                                <div 
                                    key={t.id} 
                                    className={styles.queueCard}
                                    onClick={() => handleSelectForServing(t)}
                                >
                                    <div className={styles.cardLeft}>
                                        <span className={styles.cardId}>{t.id}</span>
                                        <div className={styles.cardInfo}>
                                            <span className={styles.cardName}>{t.name}</span>
                                            <span className={styles.cardTime}>Wait: {i * 5}m</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        className={styles.tickButton}
                                        onClick={(e) => handleDirectComplete(t.id, e)}
                                        title="Mark as Processed"
                                    >
                                        ✓
                                    </button>
                                </div>
                            ))
                        )}
                     </div>
                </div>
            </div>

            {/* CONTROL STATION (RIGHT) */}
            <div className={styles.queueControls}>
                 <div className={styles.controlPanelFrame}>
                    <div className={styles.controlHeader}>ADMIN_CONSOLE</div>
                    
                    <form onSubmit={handleAdd} className={styles.addForm}>
                        <label>NEW PATIENT ENTRY</label>
                        <div className={styles.inputGroup}>
                            <input 
                                type="text" 
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder="ENTER NAME..."
                                className={styles.queueInput}
                                autoFocus
                            />
                            <button type="submit" className={styles.actionBtn}>
                                <span className={styles.btnIcon}>+</span> ISSUE
                            </button>
                        </div>
                    </form>

                    <div className={styles.controlActions}>
                        <label>SEQUENCE CONTROL</label>
                        <div className={styles.buttonGrid}>
                            <button 
                                className={styles.callBtn} 
                                onClick={handleCallNext}
                                disabled={waitingList.length === 0}
                            >
                                CALL NEXT
                            </button>
                            <button 
                                className={styles.admitBtn} 
                                onClick={handleAdmit}
                                disabled={!nowServing}
                            >
                                COMPLETE
                            </button>
                        </div>
                    </div>

                    <div className={styles.logPanel}>
                        <div className={styles.logHeader}>RECENT HISTORY</div>
                        {doneList.length === 0 && <div style={{ padding: '0.5rem', opacity: 0.5 }}>- No activity -</div>}
                        {doneList.map(t => (
                            <div key={t.id} className={styles.logItem}>
                                <span className={styles.logCheck}>✓</span>
                                <span className={styles.logId}>{t.id}</span>
                                <span className={styles.logName}>{t.name}</span>
                                <span className={styles.logTime}>{t.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
    );
};
