"use client";

import React, { useEffect, useRef, useState } from 'react';
import styles from '../PortfolioTerminal.module.css';

interface GridRunnerProps {
  onExit: () => void;
}

interface Player {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export const GridRunner: React.FC<GridRunnerProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Game State Refs (mutable for game loop)
  const playerRef = useRef<Player>({ x: 0, y: 0, angle: 0, speed: 0 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const animationFrameRef = useRef<number>(0);
  const scoreRef = useRef(0);

  // Constants
  const CAR_SIZE = 30;
  const MAX_SPEED = 15;
  const ACCELERATION = 0.4;
  const FRICTION = 0.98;
  const TURN_SPEED = 0.06;
  const GRID_SIZE = 100;

  const resetGame = () => {
      playerRef.current = { x: 0, y: 0, angle: -Math.PI / 2, speed: 0 };
      obstaclesRef.current = [];
      scoreRef.current = 0;
      setScore(0);
      setGameOver(false);
      
      // Initial obstacles
      spawnObstacles(0, 0);
  };

  const spawnObstacles = (baseX: number, baseY: number) => {
      const count = 1 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 1000 + Math.random() * 1200; 
          obstaclesRef.current.push({
              x: baseX + Math.cos(angle) * dist,
              y: baseY + Math.sin(angle) * dist,
              width: 50 + Math.random() * 50,
              height: 50 + Math.random() * 50,
              color: Math.random() > 0.5 ? '#ff00ff' : '#00ffff'
          });
      }
      
      if (obstaclesRef.current.length > 40) {
          obstaclesRef.current = obstaclesRef.current.filter(obs => {
              const dx = obs.x - baseX;
              const dy = obs.y - baseY;
              return Math.sqrt(dx*dx + dy*dy) < 3000;
          });
      }
  };

  useEffect(() => {
    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
      }
      keysRef.current[e.code] = true;
      if (!gameStarted && e.code === 'Space') {
          setGameStarted(true);
          resetGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const loop = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
      }

      const player = playerRef.current;
      const keys = keysRef.current;

      // Physics
      if (keys['ArrowUp'] || keys['KeyW']) player.speed += ACCELERATION;
      if (keys['ArrowDown'] || keys['KeyS']) player.speed -= ACCELERATION;
      
      if (Math.abs(player.speed) > 0.01) {
        if (keys['ArrowLeft'] || keys['KeyA']) player.angle -= TURN_SPEED * Math.sign(player.speed);
        if (keys['ArrowRight'] || keys['KeyD']) player.angle += TURN_SPEED * Math.sign(player.speed);
      }
      
      if (player.speed === 0) {
          if (keys['ArrowLeft'] || keys['KeyA']) player.angle -= TURN_SPEED;
          if (keys['ArrowRight'] || keys['KeyD']) player.angle += TURN_SPEED;
      }

      player.speed *= FRICTION;
      player.speed = Math.max(Math.min(player.speed, MAX_SPEED), -MAX_SPEED/2);

      player.x += Math.cos(player.angle) * player.speed;
      player.y += Math.sin(player.angle) * player.speed;

      scoreRef.current += Math.abs(player.speed) * 0.1;
      setScore(Math.floor(scoreRef.current));

      if (Math.random() < 0.03) {
          spawnObstacles(player.x, player.y);
      }

      // Drawing
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.save();
      ctx.translate(centerX - player.x, centerY - player.y);

      // Grid
      const startX = Math.floor((player.x - centerX) / GRID_SIZE) * GRID_SIZE;
      const endX = Math.floor((player.x + centerX) / GRID_SIZE) * GRID_SIZE;
      const startY = Math.floor((player.y - centerY) / GRID_SIZE) * GRID_SIZE;
      const endY = Math.floor((player.y + centerY) / GRID_SIZE) * GRID_SIZE;

      ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += GRID_SIZE) {
          ctx.moveTo(x, player.y - centerY);
          ctx.lineTo(x, player.y + centerY);
      }
      for (let y = startY; y <= endY; y += GRID_SIZE) {
          ctx.moveTo(player.x - centerX, y);
          ctx.lineTo(player.x + centerX, y);
      }
      ctx.stroke();

      // Obstacles
      obstaclesRef.current.forEach(obs => {
          ctx.fillStyle = obs.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = obs.color;
          ctx.fillRect(obs.x - obs.width/2, obs.y - obs.height/2, obs.width, obs.height);
          
          const dist = Math.sqrt((player.x - obs.x)**2 + (player.y - obs.y)**2);
          if (dist < CAR_SIZE + obs.width/2) { 
             setGameOver(true);
          }
      });
      ctx.shadowBlur = 0;

      // Player
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ffff';
      ctx.beginPath();
      ctx.moveTo(20, 0); 
      ctx.lineTo(-15, 12); 
      ctx.lineTo(-15, -12); 
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [gameStarted, gameOver]);

  return (
    <div className={styles.gameWrapper} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100, background: '#000' }}>
      {!gameStarted && !gameOver && (
          <div className={styles.gameOverlay}>
              <h1>GRID RUNNER</h1>
              <p>WASD / Arrows to Drive</p>
              <button onClick={() => { setGameStarted(true); resetGame(); }} className={styles.playBtn} style={{ width: 'auto', padding: '1rem 3rem' }}>START ENGINE</button>
              <button onClick={onExit} className={styles.textBtn}>EXIT</button>
          </div>
      )}
      
      {gameOver && (
           <div className={styles.gameOverlay}>
               <h1 style={{ color: '#ff0000', textShadow: '0 0 20px #ff0000' }}>SYSTEM FAILURE</h1>
               <p>SCORE: {score}</p>
               <button onClick={resetGame} className={styles.playBtn} style={{ width: 'auto', padding: '1rem 3rem' }}>REBOOT</button>
               <button onClick={onExit} className={styles.textBtn}>ABORT</button>
           </div>
      )}

      {gameStarted && (
          <div className={styles.scoreHud}>
              FAST_LANE // DISTANCE: {score}m
          </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
};
