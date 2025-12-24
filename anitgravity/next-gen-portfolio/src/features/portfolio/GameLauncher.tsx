"use client";

import React, { useState } from 'react';
import styles from './PortfolioTerminal.module.css';
import { GridRunner } from './games/GridRunner';
import { CyberLogistics } from './games/CyberLogistics';

interface Game {
  id: string;
  title: string;
  genre: string;
  status: 'playable' | 'coming_soon' | 'prototype';
  description: string;
  icon: string;
}

const GAMES: Game[] = [
  {
    id: 'snake',
    title: 'NEON SNAKE',
    genre: 'Classic',
    status: 'coming_soon',
    description: 'Consume bits. Grow longer. Don\'t crash.',
    icon: '🐍'
  },
  {
    id: 'pong',
    title: 'CYBER PONG',
    genre: 'Arcade',
    status: 'coming_soon',
    description: '1v1 Protocol. Deflect the orb.',
    icon: '🏓'
  },
  {
    id: 'tetris',
    title: 'BLOCK STACK',
    genre: 'Puzzle',
    status: 'coming_soon',
    description: 'Clearing memory blocks.',
    icon: '🧱'
  },
    {
    id: 'racer',
    title: 'GRID RUNNER',
    genre: 'Action',
    status: 'playable',
    description: 'High speed data evasion.',
    icon: '🏎️'
  },
  {
    id: 'cyber',
    title: 'CYBER LOGISTICS',
    genre: 'Simulation',
    status: 'playable',
    description: 'Drone delivery in neon city.',
    icon: '🛸'
  }
];

export const GameLauncher = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (activeGame === 'racer') {
      return <GridRunner onExit={() => setActiveGame(null)} />;
  }
  if (activeGame === 'cyber') {
      return <CyberLogistics onExit={() => setActiveGame(null)} />;
  }

  return (
    <div className={styles.gameContainer}>
        <div className={styles.gameHeader}>
            <span className={styles.arcadeTitle}>ARCADE_MODE // SELECT_CARTRIDGE</span>
            <div className={styles.tokenCount}>TOKENS: ∞</div>
        </div>

        <div className={styles.gameGrid}>
            {GAMES.map(game => (
                <div key={game.id} className={styles.gameCard}>
                    <div className={styles.gameIconDisplay}>
                        <div className={styles.gameIcon}>{game.icon}</div>
                        {game.status !== 'playable' && (
                             <div className={styles.statusOverlay}>{game.status.toUpperCase().replace('_', ' ')}</div>
                        )}
                    </div>
                    
                    <div className={styles.gameInfo}>
                        <div className={styles.gameTitle}>{game.title}</div>
                        <div className={styles.gameGenre}>{game.genre}</div>
                        <div className={styles.gameDesc}>{game.description}</div>
                        
                        <button 
                            className={`${styles.playBtn} ${game.status !== 'playable' ? styles.disabled : ''}`}
                            disabled={game.status !== 'playable'}
                            onClick={() => game.status === 'playable' ? setActiveGame(game.id) : null}
                        >
                            {game.status === 'playable' ? 'INSERT COIN' : 'LOCKED'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
        
        <div className={styles.footerHint}>
            Waiting for player 1... type 'exit' to return to terminal.
        </div>
    </div>
  );
};
