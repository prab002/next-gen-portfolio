import React, { useState, useEffect } from 'react';
import styles from './PortfolioTerminal.module.css';

const BOT_FRAMES = [
  `
        .=.
       |___|  .---.
      /     \\|===|
     +-------+|___|--.
     | [###] |    \\   \\
     +-------+     \\ +-----+
    /   |   \\       \\| ^_^ |
 .--.   |   .--.     +-----+
 |__|---+---|__|        |
            |           |
  `,
  `
        .=.
       |___|  .---.
      /     \\|~~~|
     +-------+|___|--.
     | [===] |    \\   \\
     +-------+     \\ +-----+
    /   |   \\       \\| o_o |
 .--.   |   .--.     +-----+
 |__|---+---|__|        |
            |           |
  `
];

export const WhoAmI = () => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [typedRole, setTypedRole] = useState('');
  const [typedHobbies, setTypedHobbies] = useState('');
  const [typedOpenTo, setTypedOpenTo] = useState('');

  const fullRole = "I am a full stack developer with extensive knowledge of DevOps & CI/CD.";
  const fullHobbies = "Hobbies: Developing AI products.";
  const fullOpenTo = "Open To: Developer-centric, awesome products.";

  // Animation for the bot
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % BOT_FRAMES.length);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Typing effect
  useEffect(() => {
    let roleIdx = 0;
    let hobbiesIdx = 0;
    let openToIdx = 0;
    
    // Type Role
    const typeRole = setInterval(() => {
      if (roleIdx < fullRole.length) {
        setTypedRole(fullRole.substring(0, roleIdx + 1));
        roleIdx++;
      } else {
        clearInterval(typeRole);
        // Start typing Hobbies
        const typeHobbies = setInterval(() => {
          if (hobbiesIdx < fullHobbies.length) {
            setTypedHobbies(fullHobbies.substring(0, hobbiesIdx + 1));
            hobbiesIdx++;
          } else {
            clearInterval(typeHobbies);
             // Start typing OpenTo
            const typeOpenTo = setInterval(() => {
                if (openToIdx < fullOpenTo.length) {
                  setTypedOpenTo(fullOpenTo.substring(0, openToIdx + 1));
                  openToIdx++;
                } else {
                  clearInterval(typeOpenTo);
                }
              }, 30);
          }
        }, 30);
      }
    }, 30);

    return () => {
        // Cleanup not strictly necessary for this simple sequential chain in useEffect, 
        // but good practice if completely rewriting. 
        // For simplicity in this "fire and forget" style, we leave it.
    };
  }, []);

  return (
    <div className={styles.whoAmIContainer}>
      <div className={styles.botContainer}>
        <pre className={styles.asciiBot}>
          {BOT_FRAMES[frameIndex]}
        </pre>
      </div>
      
      <div className={styles.infoContainer}>
        <div className={styles.infoLine}>
           <span className={styles.infoLabel}>ROLE ::</span> {typedRole}<span className={styles.cursor}>_</span>
        </div>
        {typedRole.length === fullRole.length && (
            <div className={styles.infoLine}>
            <span className={styles.infoLabel}>HOBBIES ::</span> {typedHobbies}{typedHobbies.length !== fullHobbies.length && <span className={styles.cursor}>_</span>}
            </div>
        )}
        {typedHobbies.length === fullHobbies.length && (
             <div className={styles.infoLine}>
             <span className={styles.infoLabel}>STATUS ::</span> {typedOpenTo}<span className={styles.cursor}>_</span>
          </div>
        )}
      </div>
    </div>
  );
};
